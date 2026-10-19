import { Injectable } from '@nestjs/common';

import {
  BotContext,
  BotFeature,
  BotHandler,
  BotSender,
  BotSessionService,
  BotSessionState,
  btn,
  cut,
  grid,
  msg,
  hint,
} from '@/bot';
import { CatalogKind, CatalogService } from '@/catalog/catalog.service';
import { MessengerMessage } from '@/messengers';
import { swapChoiceMessage } from '@/workout/swap.texts';

import { ModerationService, OUTCOME_TITLE } from './moderation.service';

const STATE = 'dr.wizard';

/** Накопленный ввод мастера создания своей записи. */
interface Draft {
  prefix: 'ex' | 'sx';
  step: 'name' | 'confirm' | 'muscles' | 'hold' | 'side' | 'text' | 'video';
  name?: string;
  primary: number[];
  secondary: number[];
  holdSeconds?: number;
  perSide?: boolean;
  technique?: string;
  /** Мастер открыт из замены упражнения в тренировке: созданное сразу ставим на замену. */
  swapItemId?: number;
}

const HOLD_OPTIONS = [20, 30, 45, 60];

/** Своё упражнение или растяжка: мастер по шагам, подсказка дублей, заявка на модерацию. */
@Injectable()
@BotHandler({ prefixes: ['dr'] })
export class DraftBot implements BotFeature {
  constructor(
    private readonly moderation: ModerationService,
    private readonly catalog: CatalogService,
    private readonly sessions: BotSessionService,
    private readonly sender: BotSender,
  ) {}

  public async onCallback(
    ctx: BotContext,
    _prefix: string,
    action: string,
    args: string[],
  ): Promise<void> {
    if (action === 'new') {
      const prefix = args[0] === 'sx' ? 'sx' : 'ex';
      const swapItemId =
        prefix === 'ex' && args[1] ? Number(args[1]) : undefined;
      await this.save(ctx, {
        prefix,
        step: 'name',
        primary: [],
        secondary: [],
        swapItemId,
      });
      return ctx.edit(
        msg(
          prefix === 'ex'
            ? 'Как называется упражнение?'
            : 'Как называется растяжка?',
          [
            [
              btn(
                'Отмена',
                swapItemId ? `sw:list:${swapItemId}` : 'ex:menu',
              ),
            ],
          ],
        ),
      );
    }
    if (action === 'mine') return ctx.edit(await this.mineScreen(ctx));

    const draft = await this.load(ctx);
    if (!draft) return ctx.toast('Ввод устарел — начни заново');

    switch (action) {
      case 'go':
        draft.step = 'muscles';
        await this.save(ctx, draft);
        return ctx.edit(await this.musclesScreen(draft));
      case 'm': {
        const id = Number(args[0]);
        const inPrimary = draft.primary.includes(id);
        const inSecondary = draft.secondary.includes(id);
        draft.primary = draft.primary.filter((m) => m !== id);
        draft.secondary = draft.secondary.filter((m) => m !== id);
        // Упражнение: нажатия идут по кругу «основная → вспомогательная → нет»
        if (!inPrimary && !inSecondary) draft.primary.push(id);
        else if (inPrimary && draft.prefix === 'ex') draft.secondary.push(id);
        await this.save(ctx, draft);
        return ctx.edit(await this.musclesScreen(draft));
      }
      case 'mdone':
        if (!draft.primary.length)
          return ctx.toast(
            draft.prefix === 'ex'
              ? 'Отметь хотя бы одну основную мышцу'
              : 'Отметь хотя бы одну мышцу',
          );
        if (draft.prefix === 'sx') {
          draft.step = 'hold';
          await this.save(ctx, draft);
          return ctx.edit(
            msg('Сколько секунд удерживать?', [
              HOLD_OPTIONS.map((s) => btn(`${s} сек`, `dr:h:${s}`)),
            ]),
          );
        }
        return this.askText(ctx, draft);
      case 'h':
        draft.holdSeconds = Number(args[0]);
        draft.step = 'side';
        await this.save(ctx, draft);
        return ctx.edit(
          msg('Тянуть на каждую сторону отдельно?', [
            [
              btn('Да, на каждую сторону', 'dr:s:y'),
              btn('Нет, один раз', 'dr:s:n'),
            ],
          ]),
        );
      case 's':
        draft.perSide = args[0] === 'y';
        return this.askText(ctx, draft);
      case 'skip':
        if (draft.step === 'text' && draft.prefix === 'ex')
          return this.askVideo(ctx, draft);
        return this.finish(ctx, draft);
      default:
        return ctx.toast('Кнопка устарела');
    }
  }

  public async onText(
    ctx: BotContext,
    session: BotSessionState,
  ): Promise<void> {
    const draft = session.data as Draft;
    const text = (ctx.text ?? '').trim();
    const kind: CatalogKind = draft.prefix === 'ex' ? 'exercise' : 'stretch';

    switch (draft.step) {
      case 'name': {
        if (text.length < 2 || text.length > 80) {
          await ctx.reply(msg('Название — от 2 до 80 символов.'));
          return;
        }
        draft.name = text;
        const similar = await this.catalog.similar(kind, text);
        if (similar.length) {
          draft.step = 'confirm';
          await this.save(ctx, draft);
          await ctx.reply(
            msg('Возможно, ты искал одну из этих записей справочника?', [
              ...similar.map((item) => [
                btn(
                  cut(item.name),
                  // Из замены похожее из справочника сразу ставим на замену, а не открываем карточку
                  draft.swapItemId
                    ? `sw:pick:${draft.swapItemId}:${item.id}`
                    : `${draft.prefix}:v:${item.id}`,
                ),
              ]),
              [btn(cut(`Нет, создать «${text}»`, 48), 'dr:go')],
            ]),
          );
          return;
        }
        draft.step = 'muscles';
        await this.save(ctx, draft);
        await ctx.reply(await this.musclesScreen(draft));
        return;
      }
      case 'text':
        if (text.length > 1500) {
          await ctx.reply(msg('Слишком длинно: до 1500 символов.'));
          return;
        }
        draft.technique = text;
        if (draft.prefix === 'ex') return this.askVideo(ctx, draft);
        return this.finish(ctx, draft);
      case 'video':
        if (!/^https?:\/\/\S+$/i.test(text)) {
          await ctx.reply(
            msg(
              'Это не похоже на ссылку. Пришли адрес, начинающийся с https://, или пропусти.',
            ),
          );
          return;
        }
        return this.finish(ctx, draft, text);
      default:
        await ctx.reply(msg('Сейчас жду нажатия кнопки под сообщением выше.'));
    }
  }

  // ── Шаги ────────────────────────────────────────────────────────────────

  private async askText(ctx: BotContext, draft: Draft): Promise<void> {
    draft.step = 'text';
    await this.save(ctx, draft);
    await ctx.edit(
      msg(
        draft.prefix === 'ex'
          ? `Опиши технику: ключевые пункты и типичные ошибки.\n${hint('Это по желанию — можно пропустить.')}`
          : `Опиши, как делать растяжку.\n${hint('Это по желанию — можно пропустить.')}`,
        [[btn('Пропустить', 'dr:skip')]],
      ),
    );
  }

  private async askVideo(ctx: BotContext, draft: Draft): Promise<void> {
    draft.step = 'video';
    await this.save(ctx, draft);
    await ctx.edit(
      msg(
        `Есть ссылка на видео с техникой?\n${hint('Пришли её или пропусти.')}`,
        [[btn('Пропустить', 'dr:skip')]],
      ),
    );
  }

  private async finish(
    ctx: BotContext,
    draft: Draft,
    videoUrl?: string,
  ): Promise<void> {
    const request = await this.moderation.submit(ctx.user.id, {
      kind: draft.prefix === 'ex' ? 'exercise' : 'stretch',
      name: draft.name ?? '',
      primary: draft.primary,
      secondary: draft.secondary,
      technique: draft.technique,
      videoUrl,
      holdSeconds: draft.holdSeconds,
      perSide: draft.perSide,
    });
    await this.sessions.clear(ctx);
    await this.sender.sendToAdmins(this.moderation.requestMessage(request));
    const id = request.exerciseId ?? request.stretchId;
    if (draft.swapItemId && id) {
      await ctx.edit(
        swapChoiceMessage(
          draft.swapItemId,
          id,
          `«${draft.name}» сохранён как личный черновик и отправлен на проверку.`,
        ),
      );
      return;
    }
    await ctx.edit(
      msg(
        `«${draft.name}» сохранён как личный черновик с пометкой «не проверено» и отправлен на проверку.${draft.prefix === 'ex' ? ' Его уже можно ставить в тренировки.' : ' Он уже участвует в подборе заминки.'}`,
        [
          [btn('Открыть', `${draft.prefix}:v:${id}`)],
          [btn('⬅️ Справочник', 'ex:menu')],
        ],
      ),
    );
  }

  // ── Экраны ──────────────────────────────────────────────────────────────

  private async musclesScreen(draft: Draft): Promise<MessengerMessage> {
    const muscles = await this.catalog.muscles();
    const mark = (id: number) =>
      draft.primary.includes(id)
        ? '💪 '
        : draft.secondary.includes(id)
          ? '➕ '
          : '';
    return msg(
      draft.prefix === 'ex'
        ? `«${draft.name}». Отметь мышцы.\n${hint('Одно нажатие — основная 💪, второе — вспомогательная ➕, третье — снять. Нужна хотя бы одна основная.')}`
        : `«${draft.name}». Отметь мышцы, которые тянет растяжка.`,
      [
        ...grid(
          muscles.map((m) => btn(`${mark(m.id)}${m.name}`, `dr:m:${m.id}`)),
          2,
        ),
        [btn('Готово ➡️', 'dr:mdone')],
      ],
    );
  }

  private async mineScreen(ctx: BotContext): Promise<MessengerMessage> {
    const requests = await this.moderation.mine(ctx.user.id);
    return msg(
      requests.length
        ? [
            'Твои заявки:',
            ...requests.map((r) => {
              const name = r.exercise?.name ?? r.stretch?.name ?? 'запись';
              return `• ${name} — ${OUTCOME_TITLE[r.outcome]}${r.outcome === 'REJECTED' && r.reason ? ` (${r.reason})` : ''}`;
            }),
          ].join('\n')
        : 'Заявок пока нет. Не нашёл упражнение или растяжку в справочнике — создай своё.',
      [[btn('⬅️ Справочник', 'ex:menu')]],
    );
  }

  // ── Сессия ──────────────────────────────────────────────────────────────

  private async load(ctx: BotContext): Promise<Draft | null> {
    const session = await this.sessions.get(ctx.user.id, ctx.channel);
    return session?.state === STATE ? (session.data as Draft) : null;
  }

  private async save(ctx: BotContext, draft: Draft): Promise<void> {
    await this.sessions.set(ctx, STATE, draft);
  }
}
