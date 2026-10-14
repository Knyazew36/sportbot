import { Injectable } from '@nestjs/common';

import {
  APP_SCREEN,
  appBtn,
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
import { resolveCatalogImage } from '@/catalog/catalog-image';
import { CatalogService } from '@/catalog/catalog.service';
import { EQUIPMENT_TITLE } from '@/catalog/catalog.texts';
import { Equipment } from '@/generated/prisma/client';
import { MessengerMessage } from '@/messengers';

import { Decision, DraftEdits, ModerationService } from './moderation.service';

const REJECT_REASONS = [
  'слишком частный вариант',
  'не хватает описания',
  'не подходит для зала',
];

const BACK = [btn('⬅️ Заявки', 'md:list')];

/** Ввод «одобрить с правками»: что администратор уже дописал и на каком он шаге. */
interface EditState {
  requestId: number;
  isExercise: boolean;
  step: 'text' | 'image' | 'equipment' | 'joints';
  edits: DraftEdits;
}

/** Модерация заявок — только для администратора. */
@Injectable()
@BotHandler({ prefixes: ['md'], admin: true })
export class ModerationBot implements BotFeature {
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
    const requestId = Number(args[0]);
    switch (action) {
      case 'list': {
        await this.sessions.clear(ctx);
        const requests = await this.moderation.pending();
        return ctx.edit(
          msg(
            requests.length
              ? `Заявок на проверке: ${requests.length}`
              : 'Заявок нет.',
            [
              ...requests.map((r) => [
                btn(
                  cut(
                    `${r.exercise ? '🏋️' : '🧘'} ${r.exercise?.name ?? r.stretch?.name}`,
                  ),
                  `md:v:${r.id}`,
                ),
              ]),
              [btn('⬅️ Админ', 'ad:menu')],
            ],
          ),
        );
      }
      case 'v':
        return ctx.edit(
          this.moderation.requestMessage(await this.moderation.find(requestId)),
        );
      case 'ok':
        return this.finish(ctx, await this.moderation.approve(requestId));

      // ── одобрить с правками ──
      case 'edit': {
        const request = await this.moderation.find(requestId);
        if (request.outcome !== 'PENDING')
          return ctx.toast('Заявка уже обработана');
        return this.editStep(ctx, {
          requestId,
          isExercise: !!request.exerciseId,
          step: 'text',
          edits: {},
        });
      }
      case 'es': {
        const state = await this.loadEdit(ctx);
        if (!state) return ctx.toast('Ввод устарел — открой заявку заново');
        return this.nextEditStep(ctx, state);
      }
      case 'eq': {
        const state = await this.loadEdit(ctx);
        if (!state) return ctx.toast('Ввод устарел — открой заявку заново');
        if (args[0] in EQUIPMENT_TITLE)
          state.edits.equipment = args[0] as Equipment;
        return this.nextEditStep(ctx, state);
      }
      case 'ej': {
        const state = await this.loadEdit(ctx);
        if (!state) return ctx.toast('Ввод устарел — открой заявку заново');
        const id = Number(args[0]);
        const selected = state.edits.jointIds ?? [];
        state.edits.jointIds = selected.includes(id)
          ? selected.filter((j) => j !== id)
          : [...selected, id];
        return this.editStep(ctx, state);
      }
      case 'edone': {
        const state = await this.loadEdit(ctx);
        if (!state) return ctx.toast('Ввод устарел — открой заявку заново');
        return this.finish(
          ctx,
          await this.moderation.approve(state.requestId, state.edits),
        );
      }

      // ── дубль ──
      case 'dup':
        await this.sessions.set(ctx, 'md.dup', { requestId });
        return ctx.edit(
          msg(
            `С какой записью справочника объединить?\n${hint('Напиши её название или часть.')}`,
            [BACK],
          ),
        );
      case 'dp':
        return this.finish(
          ctx,
          await this.moderation.duplicate(requestId, Number(args[1])),
        );

      // ── отклонить ──
      case 'rej':
        await this.sessions.set(ctx, 'md.rej', { requestId });
        return ctx.edit(
          msg(
            'Причина для автора? Выбери заготовку или напиши коротко текстом.',
            [
              ...REJECT_REASONS.map((reason, index) => [
                btn(reason, `md:rr:${requestId}:${index}`),
              ]),
              BACK,
            ],
          ),
        );
      case 'rr':
        return this.finish(
          ctx,
          await this.moderation.reject(
            requestId,
            REJECT_REASONS[Number(args[1])] ?? REJECT_REASONS[0],
          ),
        );
      default:
        return ctx.toast('Кнопка устарела');
    }
  }

  public async onText(
    ctx: BotContext,
    session: BotSessionState,
  ): Promise<void> {
    const text = (ctx.text ?? '').trim();

    if (session.state === 'md.rej') {
      if (!text) return;
      return this.finish(
        ctx,
        await this.moderation.reject(session.data.requestId, text),
      );
    }

    if (session.state === 'md.dup') {
      const requestId = Number(session.data.requestId);
      const request = await this.moderation.find(requestId);
      // Ищем от имени «никого»: в выдачу попадают только записи общего справочника
      const found = request.exerciseId
        ? await this.catalog.searchExercises(0, text)
        : await this.catalog.searchStretches(0, text);
      await ctx.reply(
        found.length
          ? msg('С какой записью объединить?', [
              ...found.map((item) => [
                btn(cut(item.name), `md:dp:${requestId}:${item.id}`),
              ]),
              BACK,
            ])
          : msg('Ничего не нашёл. Попробуй другое слово.', [BACK]),
      );
      return;
    }

    const state = session.data as EditState;
    if (state.step === 'text') state.edits.text = text.slice(0, 1500);
    else if (state.step === 'image')
      state.edits.imagePath = await resolveCatalogImage(text);
    else {
      await ctx.reply(msg('Сейчас жду нажатия кнопки под сообщением выше.'));
      return;
    }
    await this.nextEditStep(ctx, state);
  }

  // ── Одобрить с правками ─────────────────────────────────────────────────

  private async nextEditStep(ctx: BotContext, state: EditState): Promise<void> {
    const order: EditState['step'][] = state.isExercise
      ? ['text', 'image', 'equipment', 'joints']
      : ['text', 'image'];
    const next = order[order.indexOf(state.step) + 1];
    if (!next)
      return this.finish(
        ctx,
        await this.moderation.approve(state.requestId, state.edits),
      );
    return this.editStep(ctx, { ...state, step: next });
  }

  private async editStep(ctx: BotContext, state: EditState): Promise<void> {
    await this.sessions.set(ctx, 'md.edit', state);
    const skip = [btn('Пропустить', 'md:es')];
    let message: MessengerMessage;
    switch (state.step) {
      case 'text':
        message = msg(
          state.isExercise
            ? 'Пришли текст техники: 3–5 ключевых пунктов и типичные ошибки.'
            : 'Пришли текст «как делать».',
          [skip],
        );
        break;
      case 'image':
        message = msg(
          'Пришли ссылку на картинку (https://…, JPEG/PNG/WebP) или имя файла из uploads/catalog.',
          [skip],
        );
        break;
      case 'equipment':
        message = msg('Инвентарь?', [
          ...grid(
            (Object.keys(EQUIPMENT_TITLE) as Equipment[]).map((e) =>
              btn(EQUIPMENT_TITLE[e], `md:eq:${e}`),
            ),
            2,
          ),
          skip,
        ]);
        break;
      default: {
        const joints = await this.catalog.joints();
        const selected = state.edits.jointIds ?? [];
        message = msg(
          `Какие суставы нагружает?\n${hint('Отметь и нажми «Готово».')}`,
          [
            ...grid(
              joints.map((j) =>
                btn(
                  `${selected.includes(j.id) ? '✅ ' : ''}${j.name}`,
                  `md:ej:${j.id}`,
                ),
              ),
              2,
            ),
            [btn('Готово — одобрить', 'md:edone')],
          ],
        );
      }
    }
    await ctx.edit(message);
  }

  private async loadEdit(ctx: BotContext): Promise<EditState | null> {
    const session = await this.sessions.get(ctx.user.id, ctx.channel);
    return session?.state === 'md.edit' ? (session.data as EditState) : null;
  }

  // ── Итог ────────────────────────────────────────────────────────────────

  /** Показать администратору итог и уведомить автора об исходе. */
  private async finish(ctx: BotContext, decision: Decision): Promise<void> {
    await this.sessions.clear(ctx);
    if (decision.authorId)
      await this.sender.sendToUserId(
        decision.authorId,
        msg(decision.text, [[appBtn(APP_SCREEN.mine)]]),
      );
    await ctx.edit(msg(`Готово. Автору ушло:\n${decision.text}`, [BACK]));
  }
}
