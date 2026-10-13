import { Injectable } from '@nestjs/common';

import {
  BotContext,
  BotFeature,
  BotHandler,
  BotSessionService,
  BotSessionState,
  btn,
  fmtDay,
  grid,
  localToday,
  msg,
  parseUserDate,
  hint,
} from '@/bot';
import { CatalogService } from '@/catalog/catalog.service';
import { MessengerMessage } from '@/messengers';

import { LimitationService } from './limitation.service';

const DISCLAIMER = 'Бот не заменяет врача: при боли обратись к специалисту.';

/** Ограничения по суставам: зона, срок, дисклеймер один раз. */
@Injectable()
@BotHandler({ prefixes: ['lm'] })
export class LimitationBot implements BotFeature {
  constructor(
    private readonly limitations: LimitationService,
    private readonly catalog: CatalogService,
    private readonly sessions: BotSessionService,
  ) {}

  public async onCallback(
    ctx: BotContext,
    _prefix: string,
    action: string,
    args: string[],
  ): Promise<void> {
    const id = Number(args[0]);
    await this.sessions.clear(ctx);
    switch (action) {
      case 'menu':
        return ctx.edit(await this.menu(ctx));
      case 'add': {
        const joints = await this.catalog.joints();
        return ctx.edit(
          msg('Какую зону беречь?', [
            ...grid(
              joints.map((j) => btn(j.name, `lm:j:${j.id}`)),
              2,
            ),
            [btn('⬅️ Ограничения', 'lm:menu')],
          ]),
        );
      }
      case 'j':
        return ctx.edit(
          msg('На какой срок?', [
            [
              btn('До даты', `lm:until:${id}`),
              btn('До отмены', `lm:forever:${id}`),
            ],
            [btn('⬅️ Назад', 'lm:add')],
          ]),
        );
      case 'until':
        await this.sessions.set(ctx, `lm.until:${id}`);
        return ctx.edit(
          msg(`До какой даты?\n${hint('Напиши, например «25.11».')}`, [
            [btn('Отмена', 'lm:menu')],
          ]),
        );
      case 'forever':
        return ctx.edit(await this.enable(ctx, id, null));
      case 'off':
        await this.limitations.cancel(ctx.user.id, id);
        await ctx.toast('Ограничение снято');
        return ctx.edit(await this.menu(ctx));
      default:
        return ctx.toast('Кнопка устарела');
    }
  }

  public async onText(
    ctx: BotContext,
    session: BotSessionState,
  ): Promise<void> {
    const jointId = Number(session.state.split(':')[1]);
    const today = localToday(ctx.profile.timeZone);
    const date = parseUserDate(ctx.text ?? '', today);
    if (!date || date < today) {
      await ctx.reply(
        msg('Не понял дату. Напиши будущую дату, например «25.11».'),
      );
      return;
    }
    await this.sessions.clear(ctx);
    await ctx.reply(await this.enable(ctx, jointId, date));
  }

  // ── Экраны ──────────────────────────────────────────────────────────────

  private async enable(
    ctx: BotContext,
    jointId: number,
    endDate: Date | null,
  ): Promise<MessengerMessage> {
    const { jointName, showDisclaimer } = await this.limitations.add(
      ctx.profile,
      jointId,
      endDate,
    );
    const zone = jointName.toLowerCase();
    return msg(
      [
        `Отметил: ${zone}, ${endDate ? `до ${fmtDay(endDate)}` : 'до отмены'}. Упражнения с нагрузкой на эту зону буду помечать ⚠️ и предлагать замену.`,
        ...(showDisclaimer ? [DISCLAIMER] : []),
      ].join('\n'),
      [[btn('⬅️ Ограничения', 'lm:menu')]],
    );
  }

  private async menu(ctx: BotContext): Promise<MessengerMessage> {
    const items = await this.limitations.active(
      ctx.user.id,
      localToday(ctx.profile.timeZone),
    );
    return msg(
      items.length
        ? [
            'Действующие ограничения:',
            ...items.map(
              (item) =>
                `• ${item.joint.name} — ${item.endDate ? `до ${fmtDay(item.endDate)}` : 'до отмены'}`,
            ),
            '',
            'На растяжки ограничения не действуют.',
          ].join('\n')
        : 'Ограничений нет. Если беспокоит сустав — отметь зону: упражнения с нагрузкой на неё буду помечать ⚠️ и предлагать замену.',
      [
        ...items.map((item) => [
          btn(`Снять: ${item.joint.name.toLowerCase()}`, `lm:off:${item.id}`),
        ]),
        [btn('➕ Добавить', 'lm:add')],
        [btn('⬅️ Настройки', 'st:menu')],
      ],
    );
  }
}
