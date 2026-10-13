import { Injectable, NotFoundException } from '@nestjs/common';

import {
  BACK_TO_MENU,
  BotContext,
  BotFeature,
  BotHandler,
  BotSender,
  BotSessionService,
  BotSessionState,
  btn,
  cut,
  grid,
  linkBtn,
  msg,
  hint,
} from '@/bot';
import { MessengerButton } from '@/messengers';

import { CatalogKind, CatalogService } from './catalog.service';
import { exerciseCard, stretchCard } from './catalog.texts';

const KIND_BY_PREFIX: Record<string, CatalogKind> = {
  ex: 'exercise',
  sx: 'stretch',
};

/** Справочник: поиск по названию и по мышце, карточка с картинкой и видео, жалоба на описание. */
@Injectable()
@BotHandler({ prefixes: ['ex', 'sx'], commands: ['catalog'] })
export class CatalogBot implements BotFeature {
  constructor(
    private readonly catalog: CatalogService,
    private readonly sessions: BotSessionService,
    private readonly sender: BotSender,
  ) {}

  public async onCommand(ctx: BotContext): Promise<void> {
    await ctx.reply(this.menu());
  }

  public async onCallback(
    ctx: BotContext,
    prefix: string,
    action: string,
    args: string[],
  ): Promise<void> {
    const kind = KIND_BY_PREFIX[prefix];
    switch (action) {
      case 'menu':
        await this.sessions.clear(ctx);
        return ctx.edit(this.menu());
      case 'find':
        await this.sessions.set(ctx, `${prefix}.search`);
        return ctx.edit(
          msg(
            kind === 'exercise'
              ? 'Напиши название упражнения или его часть.'
              : 'Напиши название растяжки или её часть.',
            [[btn('⬅️ Справочник', 'ex:menu')]],
          ),
        );
      case 'mus':
        return this.showMuscles(ctx, prefix);
      case 'bm':
        return this.showByMuscle(ctx, prefix, Number(args[0]), Number(args[1]));
      case 'v':
        // w — карточку открыли из шага тренировки: вместо навигации по справочнику — возврат к ней
        return this.showCard(ctx, prefix, Number(args[0]), args[1] === 'w');
      case 'close':
        // Шаг тренировки остался выше в чате и по-прежнему ждёт ввода подхода
        if (!(await ctx.remove()))
          await ctx.toast('Продолжай: шаг тренировки — выше в чате');
        return;
      case 'cmp':
        return this.askComplaint(ctx, prefix, Number(args[0]), args[1] === 'w');
      case 'cmpx':
        await this.restoreSession(ctx);
        if (!(await ctx.remove())) await ctx.toast('Отменено');
        return;
      default:
        return ctx.toast('Кнопка устарела');
    }
  }

  public async onText(
    ctx: BotContext,
    session: BotSessionState,
  ): Promise<void> {
    const [prefix] = session.state.split('.');
    const kind = KIND_BY_PREFIX[prefix];
    const text = ctx.text ?? '';

    if (session.state.endsWith('.search')) {
      const found =
        kind === 'exercise'
          ? await this.catalog.searchExercises(ctx.user.id, text)
          : await this.catalog.searchStretches(ctx.user.id, text);
      if (!found.length) {
        await ctx.reply(
          msg('Ничего не нашёл. Попробуй другое слово или создай своё.', [
            [btn('➕ Создать своё', `dr:new:${prefix}`)],
            [btn('⬅️ Справочник', 'ex:menu')],
          ]),
        );
        return;
      }
      await ctx.reply(
        msg('Нашёл:', [
          ...found.map((item) => [
            btn(this.label(item), `${prefix}:v:${item.id}`),
          ]),
          [btn('⬅️ Справочник', 'ex:menu')],
        ]),
      );
      return;
    }

    const id = Number(session.state.split(':')[1]);
    const complaint = await this.catalog.createComplaint(
      ctx.user.id,
      kind,
      id,
      text,
    );
    const fromWorkout = 'back' in session.data;
    if (fromWorkout) await this.restoreSession(ctx, session);
    else await this.sessions.clear(ctx);
    const title = complaint.exercise?.name ?? complaint.stretch?.name ?? '';
    await this.sender.sendToAdmins(
      msg(
        `Жалоба на описание: «${title}» от ${ctx.profile.displayName}\n\n${complaint.text}`,
        [
          [
            btn('Исправлено', `cp:ok:${complaint.id}`),
            btn('Отклонить', `cp:no:${complaint.id}`),
          ],
        ],
      ),
    );
    await ctx.reply(
      msg('Спасибо, передал администратору.', [
        [fromWorkout ? btn('⬅️ Вернуться', 'ex:close') : BACK_TO_MENU],
      ]),
    );
  }

  // ── Жалоба ──────────────────────────────────────────────────────────────

  private async askComplaint(
    ctx: BotContext,
    prefix: string,
    id: number,
    fromWorkout: boolean,
  ): Promise<void> {
    const state = `${prefix}.cmp:${id}`;
    if (fromWorkout) {
      // Жалоба занимает ожидание ввода подхода — запоминаем его, чтобы вернуть после
      const current = await this.sessions.get(ctx.user.id, ctx.channel);
      const back: unknown =
        current && 'back' in current.data ? current.data.back : current;
      await this.sessions.set(ctx, state, { back });
    } else {
      await this.sessions.set(ctx, state);
    }
    await ctx.reply(
      msg(
        `Что не так в описании?\n${hint('Напиши одним сообщением (до 500 символов).')}`,
        [[btn('Отмена', fromWorkout ? 'ex:cmpx' : 'ex:menu')]],
      ),
    );
  }

  /** Вернуть ожидание ввода, которое было до жалобы из тренировки. */
  private async restoreSession(
    ctx: BotContext,
    session?: BotSessionState | null,
  ): Promise<void> {
    const current =
      session ?? (await this.sessions.get(ctx.user.id, ctx.channel));
    const back = current?.data.back as BotSessionState | null | undefined;
    if (back) await this.sessions.set(ctx, back.state, back.data);
    else await this.sessions.clear(ctx);
  }

  // ── Экраны ──────────────────────────────────────────────────────────────

  private menu() {
    return msg('Справочник', [
      [btn('🔎 Упражнение по названию', 'ex:find')],
      [btn('💪 Упражнения по мышце', 'ex:mus')],
      [btn('🔎 Растяжка по названию', 'sx:find')],
      [btn('🧘 Растяжки по мышце', 'sx:mus')],
      [
        btn('➕ Своё упражнение', 'dr:new:ex'),
        btn('➕ Своя растяжка', 'dr:new:sx'),
      ],
      [btn('📝 Мои заявки', 'dr:mine')],
      [BACK_TO_MENU],
    ]);
  }

  private async showMuscles(ctx: BotContext, prefix: string): Promise<void> {
    const muscles = await this.catalog.muscles();
    await ctx.edit(
      msg('Выбери группу мышц:', [
        ...grid(
          muscles.map((m) => btn(m.name, `${prefix}:bm:${m.id}:1`)),
          2,
        ),
        [btn('⬅️ Справочник', 'ex:menu')],
      ]),
    );
  }

  private async showByMuscle(
    ctx: BotContext,
    prefix: string,
    muscleId: number,
    page: number,
  ): Promise<void> {
    const kind = KIND_BY_PREFIX[prefix];
    const { items, meta } =
      kind === 'exercise'
        ? await this.catalog.exercisesByMuscle(ctx.user.id, muscleId, page)
        : await this.catalog.stretchesByMuscle(ctx.user.id, muscleId, page);
    const muscle = (await this.catalog.muscles()).find(
      (m) => m.id === muscleId,
    );
    const nav: MessengerButton[] = [];
    if (meta.hasPrevPage)
      nav.push(btn('◀️', `${prefix}:bm:${muscleId}:${page - 1}`));
    if (meta.hasNextPage)
      nav.push(btn('▶️', `${prefix}:bm:${muscleId}:${page + 1}`));
    await ctx.edit(
      msg(
        items.length
          ? `${muscle?.name ?? 'Мышца'}: ${meta.total}, стр. ${meta.page} из ${meta.totalPages}`
          : `${muscle?.name ?? 'Мышца'}: пока пусто.`,
        [
          ...items.map((item) => [
            btn(this.label(item), `${prefix}:v:${item.id}`),
          ]),
          ...(nav.length ? [nav] : []),
          [btn('⬅️ Мышцы', `${prefix}:mus`)],
        ],
      ),
    );
  }

  private async showCard(
    ctx: BotContext,
    prefix: string,
    id: number,
    fromWorkout = false,
  ): Promise<void> {
    const kind = KIND_BY_PREFIX[prefix];
    const entity =
      kind === 'exercise'
        ? await this.catalog.findExercise(ctx.user.id, id)
        : await this.catalog.findStretch(ctx.user.id, id);
    if (!entity) throw new NotFoundException('Запись не найдена.');

    const buttons: MessengerButton[][] = [];
    if ('videoUrl' in entity && entity.videoUrl)
      buttons.push([linkBtn('🎬 Видео', entity.videoUrl)]);
    // Жалоба — только на запись общего справочника: свой черновик автор правит сам
    if (entity.status === 'CATALOG')
      buttons.push([
        btn(
          '✏️ Ошибка в описании',
          `${prefix}:cmp:${id}${fromWorkout ? ':w' : ''}`,
        ),
      ]);
    buttons.push([
      fromWorkout
        ? btn('⬅️ Вернуться', 'ex:close')
        : btn('⬅️ Справочник', 'ex:menu'),
    ]);

    const text =
      'technique' in entity ? exerciseCard(entity) : stretchCard(entity);
    const image = this.catalog.imageOf(entity, ctx.channel);
    // Карточка — всегда новым сообщением: список, из которого её открыли, остаётся под рукой
    const sent = await ctx.reply({ text, buttons, image });
    if (image && !image.cachedId)
      await this.catalog.rememberImage(kind, id, ctx.channel, sent.imageId);
  }

  private label(item: { name: string; status: string }): string {
    return cut(`${item.status === 'DRAFT' ? '📝 ' : ''}${item.name}`);
  }
}
