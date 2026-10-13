import {
  HttpException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { PrismaService } from 'prisma/prisma.service';

import {
  BOT_HANDLER_METADATA,
  BotHandlerOptions,
} from './bot-handler.decorator';
import { BotSessionService } from './bot-session.service';
import { BotContext, BotFeature, isAdmin } from './bot.types';

interface RegisteredHandler {
  name: string;
  feature: BotFeature;
  options: BotHandlerOptions;
}

/** Префикс обработчика первого запуска и главного меню — роутер обращается к ним напрямую. */
const ONBOARDING_PREFIX = 'ob';
const MENU_PREFIX = 'mn';
/** Префикс привязки второго мессенджера: идёт мимо первого запуска. */
const LINK_PREFIX = 'ln';

/**
 * Единая точка входа событий бота: блокировка → первый запуск → обработчик по команде,
 * префиксу кнопки или ожиданию ввода (раздел 23.3 ТЗ).
 */
@Injectable()
export class BotRouter implements OnApplicationBootstrap {
  private readonly logger = new Logger(`🤖 ${BotRouter.name}`);
  private readonly byPrefix = new Map<string, RegisteredHandler>();
  private readonly byCommand = new Map<string, RegisteredHandler>();
  private readonly byStartPayload = new Map<string, RegisteredHandler>();

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly sessions: BotSessionService,
  ) {}

  public onApplicationBootstrap(): void {
    for (const wrapper of this.discovery.getProviders()) {
      const instance = wrapper.instance as BotFeature | undefined;
      if (!instance || typeof instance !== 'object' || !wrapper.metatype)
        continue;
      const options = this.reflector.get<BotHandlerOptions | undefined>(
        BOT_HANDLER_METADATA,
        wrapper.metatype,
      );
      if (!options) continue;
      const handler: RegisteredHandler = {
        name: wrapper.metatype.name,
        feature: instance,
        options,
      };
      for (const prefix of options.prefixes) this.byPrefix.set(prefix, handler);
      for (const command of options.commands ?? [])
        this.byCommand.set(command, handler);
      for (const payload of options.startPayloads ?? [])
        this.byStartPayload.set(payload, handler);
    }
    this.logger.log(
      `Обработчики бота: префиксов — ${this.byPrefix.size}, команд — ${this.byCommand.size}`,
    );
  }

  // ── Вход ────────────────────────────────────────────────────────────────

  public async handle(ctx: BotContext): Promise<void> {
    const where = `userId=${ctx.user.id}, ${ctx.channel}`;
    try {
      if (await this.isBlocked(ctx)) {
        this.logger.warn(`Заблокированный пользователь, ${where}`);
        await ctx.toast('Доступ к боту закрыт.');
        return;
      }
      ctx.profile = ctx.user.sportProfile ?? (await this.createProfile(ctx));
      ctx.user.sportProfile = ctx.profile;
      // Текст пользователя в лог не пишем — только вид события
      this.logger.log(
        `${ctx.kind}${ctx.command ? ` /${ctx.command}` : ''}${ctx.payload ? ` ${ctx.payload}` : ''}, ${where}`,
      );
      await this.dispatch(ctx);
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() < 500) {
        // Ожидаемый отказ сервиса («не найдено», «лимит») — текст уже для пользователя
        this.logger.warn(`Отказ: ${error.message}, ${where}`);
        await ctx.toast(error.message).catch(() => undefined);
        return;
      }
      this.logger.error(
        `Ошибка обработчика: ${ctx.kind} ${ctx.command ?? ctx.payload ?? ''}, ${where}`,
        (error as Error).stack,
      );
      await ctx
        .toast('Что-то пошло не так, попробуй ещё раз')
        .catch(() => undefined);
    }
  }

  // ── Маршрутизация ───────────────────────────────────────────────────────

  private async dispatch(ctx: BotContext): Promise<void> {
    // Любая команда сбрасывает ожидание ввода
    if (ctx.kind === 'command') await this.sessions.clear(ctx);

    if (await this.dispatchLink(ctx)) return;

    if (!ctx.profile.onboardedAt) return this.dispatchOnboarding(ctx);

    if (ctx.kind === 'command') {
      const command = ctx.command ?? 'menu';
      if (command === 'start' && ctx.startPayload) {
        const key = ctx.startPayload.split('_')[0];
        const handler = this.byStartPayload.get(key);
        if (handler?.feature.onStart) {
          return handler.feature.onStart(
            ctx,
            ctx.startPayload.slice(key.length + 1),
          );
        }
      }
      const handler = this.byCommand.get(command);
      if (!handler || !(await this.allowed(ctx, handler)))
        return this.menu(ctx);
      return handler.feature.onCommand?.(ctx, command);
    }

    if (ctx.kind === 'callback') {
      const [prefix, action = '', ...args] = (ctx.payload ?? '').split(':');
      const handler = this.byPrefix.get(prefix);
      if (!handler?.feature.onCallback) {
        this.logger.warn(`Нет обработчика кнопки ${ctx.payload}`);
        return ctx.toast('Кнопка устарела');
      }
      if (!(await this.allowed(ctx, handler))) return;
      return handler.feature.onCallback(ctx, prefix, action, args);
    }

    if (ctx.kind === 'document') {
      // Файлы боту шлёт только администратор — импорт справочника
      const handler = this.byPrefix.get('ad');
      if (handler?.feature.onDocument && isAdmin(ctx.user))
        return handler.feature.onDocument(ctx);
      return this.menu(ctx);
    }

    const session = await this.sessions.get(ctx.user.id, ctx.channel);
    if (session) {
      const handler = this.byPrefix.get(session.state.split(/[.:]/)[0]);
      if (handler?.feature.onText && (await this.allowed(ctx, handler)))
        return handler.feature.onText(ctx, session);
    }
    return this.menu(ctx);
  }

  /**
   * Ссылка привязки `start=ln_<code>` и её кнопки работают и до конца первого запуска: во втором
   * мессенджере человек чаще всего новичок, и первый запуск ссылку бы проглотил.
   */
  private async dispatchLink(ctx: BotContext): Promise<boolean> {
    const link = this.byPrefix.get(LINK_PREFIX)?.feature;
    if (!link) return false;
    const startPrefix = `${LINK_PREFIX}_`;
    if (
      ctx.kind === 'command' &&
      ctx.command === 'start' &&
      ctx.startPayload?.startsWith(startPrefix)
    ) {
      await link.onStart?.(ctx, ctx.startPayload.slice(startPrefix.length));
      return true;
    }
    if (ctx.kind === 'callback' && ctx.payload?.startsWith(`${LINK_PREFIX}:`)) {
      const [prefix, action = '', ...args] = ctx.payload.split(':');
      await link.onCallback?.(ctx, prefix, action, args);
      return true;
    }
    return false;
  }

  /** Пользователя без законченного первого запуска любое действие возвращает к текущему шагу. */
  private async dispatchOnboarding(ctx: BotContext): Promise<void> {
    const onboarding = this.byPrefix.get(ONBOARDING_PREFIX)?.feature;
    if (!onboarding) throw new Error('Обработчик первого запуска не подключён');
    if (ctx.kind === 'callback' && ctx.payload?.startsWith('ob:')) {
      const [prefix, action = '', ...args] = ctx.payload.split(':');
      return onboarding.onCallback?.(ctx, prefix, action, args);
    }
    if (ctx.kind === 'text') {
      const session = await this.sessions.get(ctx.user.id, ctx.channel);
      if (session?.state.startsWith('ob.'))
        return onboarding.onText?.(ctx, session);
    }
    return onboarding.onCommand?.(ctx, 'start');
  }

  private async menu(ctx: BotContext): Promise<void> {
    await this.byPrefix.get(MENU_PREFIX)?.feature.onCommand?.(ctx, 'menu');
  }

  // ── Проверки ────────────────────────────────────────────────────────────

  private async allowed(
    ctx: BotContext,
    handler: RegisteredHandler,
  ): Promise<boolean> {
    if (!handler.options.admin || isAdmin(ctx.user)) return true;
    this.logger.warn(
      `Не администратор стучится в ${handler.name}, userId=${ctx.user.id}`,
    );
    await ctx.toast('Недоступно');
    return false;
  }

  private async isBlocked(ctx: BotContext): Promise<boolean> {
    const externalId =
      ctx.channel === 'TELEGRAM' ? ctx.user.telegramId : ctx.user.maxId;
    if (!externalId) return false;
    const blocked = await this.prisma.blockedAccount.findUnique({
      where: { channel_externalId: { channel: ctx.channel, externalId } },
      select: { id: true },
    });
    return !!blocked;
  }

  private createProfile(ctx: BotContext) {
    const tg = ctx.user.telegramData as { first_name?: string } | null;
    const max = ctx.user.maxData as {
      name?: string;
      first_name?: string;
    } | null;
    const displayName =
      ctx.user.name ||
      (ctx.channel === 'TELEGRAM'
        ? tg?.first_name
        : (max?.first_name ?? max?.name)) ||
      tg?.first_name ||
      max?.name ||
      'Спортсмен';
    this.logger.log(`Новый спортивный профиль, userId=${ctx.user.id}`);
    return this.prisma.sportProfile.upsert({
      where: { userId: ctx.user.id },
      update: {},
      create: {
        userId: ctx.user.id,
        displayName: displayName.slice(0, 64),
        trainingDays: [1, 3, 5],
      },
    });
  }
}
