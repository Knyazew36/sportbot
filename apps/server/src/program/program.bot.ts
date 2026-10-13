import { Injectable } from '@nestjs/common';

import {
  BACK_TO_MENU,
  BotContext,
  BotFeature,
  BotHandler,
  BotSessionService,
  BotSessionState,
  btn,
  cut,
  grid,
  msg,
  hint,
} from '@/bot';
import { CatalogService } from '@/catalog/catalog.service';
import { MessengerButton, MessengerMessage } from '@/messengers';

import { ProgramService } from './program.service';
import {
  cardioText,
  complexesCount,
  exercisesCount,
  planText,
} from './program.texts';

/** Программы и комплексы: создание с шаблона и с нуля, редактор, активная программа. */
@Injectable()
@BotHandler({ prefixes: ['pr', 'cx'], commands: ['programs'] })
export class ProgramBot implements BotFeature {
  constructor(
    private readonly programs: ProgramService,
    private readonly catalog: CatalogService,
    private readonly sessions: BotSessionService,
  ) {}

  public async onCommand(ctx: BotContext): Promise<void> {
    await ctx.reply(await this.listScreen(ctx));
  }

  public async onCallback(
    ctx: BotContext,
    prefix: string,
    action: string,
    args: string[],
  ): Promise<void> {
    const userId = ctx.user.id;
    const id = Number(args[0]);
    await this.sessions.clear(ctx);

    if (prefix === 'pr') {
      switch (action) {
        case 'list':
          return ctx.edit(await this.listScreen(ctx));
        case 'v':
          return ctx.edit(await this.programScreen(ctx, id));
        case 'tpl':
          return ctx.edit(await this.templatesScreen());
        case 'copy': {
          const program = await this.programs.copy(id, userId);
          await ctx.toast('Программа добавлена');
          return ctx.edit(await this.programScreen(ctx, program.id));
        }
        case 'new':
          await this.sessions.set(ctx, 'pr.new');
          return ctx.edit(
            msg('Как назвать программу?', [[btn('Отмена', 'pr:list')]]),
          );
        case 'ren':
          await this.sessions.set(ctx, `pr.ren:${id}`);
          return ctx.edit(
            msg('Новое название программы?', [[btn('Отмена', `pr:v:${id}`)]]),
          );
        case 'addc':
          await this.sessions.set(ctx, `pr.addc:${id}`);
          return ctx.edit(
            msg(
              `Как назвать комплекс?\n${hint('Например «День A» или «Грудь и трицепс».')}`,
              [[btn('Отмена', `pr:v:${id}`)]],
            ),
          );
        case 'act':
          await this.programs.setActive(userId, id);
          ctx.profile.activeProgramId = id;
          await ctx.toast('Программа активна');
          return ctx.edit(await this.programScreen(ctx, id));
        case 'del':
          return ctx.edit(
            msg(
              'Удалить программу со всеми комплексами? История тренировок сохранится.',
              [
                [
                  btn('Да, удалить', `pr:delok:${id}`),
                  btn('Нет', `pr:v:${id}`),
                ],
              ],
            ),
          );
        case 'delok':
          await this.programs.remove(userId, id);
          if (ctx.profile.activeProgramId === id)
            ctx.profile.activeProgramId = null;
          await ctx.toast('Программа удалена');
          return ctx.edit(await this.listScreen(ctx));
      }
    }

    switch (action) {
      case 'v':
        return ctx.edit(await this.complexScreen(ctx, id));
      case 'ren':
        await this.sessions.set(ctx, `cx.ren:${id}`);
        return ctx.edit(
          msg('Новое название комплекса?', [[btn('Отмена', `cx:v:${id}`)]]),
        );
      case 'up':
      case 'dn': {
        const programId = await this.programs.moveComplex(
          userId,
          id,
          action === 'up' ? -1 : 1,
        );
        return ctx.edit(await this.programScreen(ctx, programId));
      }
      case 'del':
        return ctx.edit(
          msg('Удалить комплекс?', [
            [btn('Да, удалить', `cx:delok:${id}`), btn('Нет', `cx:v:${id}`)],
          ]),
        );
      case 'delok': {
        const programId = await this.programs.removeComplex(userId, id);
        await ctx.toast('Комплекс удалён');
        return ctx.edit(await this.programScreen(ctx, programId));
      }
      case 'add':
        return ctx.edit(
          msg('Как найти упражнение?', [
            [btn('🔎 По названию', `cx:af:${id}`)],
            [btn('💪 По группе мышц', `cx:am:${id}`)],
            [btn('➕ Создать своё', 'dr:new:ex')],
            [btn('⬅️ Комплекс', `cx:v:${id}`)],
          ]),
        );
      case 'af':
        await this.sessions.set(ctx, `cx.find:${id}`);
        return ctx.edit(
          msg('Напиши название упражнения или его часть.', [
            [btn('Отмена', `cx:v:${id}`)],
          ]),
        );
      case 'am': {
        const muscles = await this.catalog.muscles();
        return ctx.edit(
          msg('Выбери группу мышц:', [
            ...grid(
              muscles.map((m) => btn(m.name, `cx:ml:${id}:${m.id}:1`)),
              2,
            ),
            [btn('⬅️ Комплекс', `cx:v:${id}`)],
          ]),
        );
      }
      case 'ml':
        return ctx.edit(
          await this.muscleListScreen(
            ctx,
            id,
            Number(args[1]),
            Number(args[2]),
          ),
        );
      case 'pick':
        await this.programs.addExercise(userId, id, Number(args[1]));
        await ctx.toast('Добавлено: 3 × 8–12');
        return ctx.edit(await this.complexScreen(ctx, id));
      case 'cardio': {
        const complex = await this.programs.findComplex(userId, id);
        await this.sessions.set(ctx, `cx.cardio:${id}`);
        return ctx.edit(
          msg(
            `Какое кардио после упражнений и сколько минут?\n${hint('Например «Беговая дорожка 30».')}`,
            [
              ...(cardioText(complex)
                ? [[btn('🗑 Убрать кардио', `cx:cardiorm:${id}`)]]
                : []),
              [btn('Отмена', `cx:v:${id}`)],
            ],
          ),
        );
      }
      case 'cardiorm':
        await this.programs.clearCardio(userId, id);
        await ctx.toast('Кардио убрано');
        return ctx.edit(await this.complexScreen(ctx, id));
      case 'e':
        return ctx.edit(await this.itemScreen(ctx, id));
      case 'plan':
        await this.sessions.set(ctx, `cx.plan:${id}`);
        return ctx.edit(
          msg(
            `Введи подходы и повторы.\n${hint('«4 8 12» — 4 подхода по 8–12, «3 10» — 3 по 10.')}`,
            [[btn('Отмена', `cx:e:${id}`)]],
          ),
        );
      case 'eup':
      case 'edn': {
        const complexId = await this.programs.moveItem(
          userId,
          id,
          action === 'eup' ? -1 : 1,
        );
        return ctx.edit(await this.complexScreen(ctx, complexId));
      }
      case 'erm': {
        const complexId = await this.programs.removeItem(userId, id);
        await ctx.toast('Убрано из комплекса');
        return ctx.edit(await this.complexScreen(ctx, complexId));
      }
      default:
        return ctx.toast('Кнопка устарела');
    }
  }

  public async onText(
    ctx: BotContext,
    session: BotSessionState,
  ): Promise<void> {
    const userId = ctx.user.id;
    const text = ctx.text ?? '';
    const [state, rawId] = session.state.split(':');
    const id = Number(rawId);

    switch (state) {
      case 'pr.new': {
        const program = await this.programs.create(userId, text);
        await this.sessions.clear(ctx);
        await ctx.reply(await this.programScreen(ctx, program.id));
        return;
      }
      case 'pr.ren':
        await this.programs.rename(userId, id, text);
        await this.sessions.clear(ctx);
        await ctx.reply(await this.programScreen(ctx, id));
        return;
      case 'pr.addc': {
        const complex = await this.programs.addComplex(userId, id, text);
        await this.sessions.clear(ctx);
        await ctx.reply(await this.complexScreen(ctx, complex.id));
        return;
      }
      case 'cx.ren':
        await this.programs.renameComplex(userId, id, text);
        await this.sessions.clear(ctx);
        await ctx.reply(await this.complexScreen(ctx, id));
        return;
      case 'cx.cardio':
        await this.programs.setCardio(userId, id, text);
        await this.sessions.clear(ctx);
        await ctx.reply(await this.complexScreen(ctx, id));
        return;
      case 'cx.plan': {
        const item = await this.programs.setPlan(userId, id, text);
        await this.sessions.clear(ctx);
        await ctx.reply(await this.complexScreen(ctx, item.complexId));
        return;
      }
      case 'cx.find': {
        const found = await this.catalog.searchExercises(userId, text);
        await ctx.reply(
          found.length
            ? msg('Нашёл — выбери, что добавить:', [
                ...found.map((e) => [
                  btn(this.exerciseLabel(e), `cx:pick:${id}:${e.id}`),
                ]),
                [btn('⬅️ Комплекс', `cx:v:${id}`)],
              ])
            : msg('Ничего не нашёл. Попробуй другое слово.', [
                [btn('➕ Создать своё', 'dr:new:ex')],
                [btn('⬅️ Комплекс', `cx:v:${id}`)],
              ]),
        );
        return;
      }
    }
  }

  // ── Экраны ──────────────────────────────────────────────────────────────

  private async listScreen(ctx: BotContext): Promise<MessengerMessage> {
    const programs = await this.programs.list(ctx.user.id);
    const activeId = ctx.profile.activeProgramId;
    return msg(
      programs.length
        ? 'Твои программы. Активная отмечена ✅ — комплексы из неё идут по очереди.'
        : 'Программ пока нет. Возьми шаблон или собери свою.',
      [
        ...programs.map((p) => [
          btn(
            cut(
              `${p.id === activeId ? '✅ ' : ''}${p.name} · ${complexesCount(p._count.complexes)}`,
              48,
            ),
            `pr:v:${p.id}`,
          ),
        ]),
        [btn('📦 Готовые', 'pr:tpl')],
        [btn('➕ Создать с нуля', 'pr:new')],
        [BACK_TO_MENU],
      ],
    );
  }

  private async templatesScreen(): Promise<MessengerMessage> {
    const templates = await this.programs.templates();
    return msg(
      templates.length
        ? 'Шаблоны. Получишь копию — её можно править под себя.'
        : 'Шаблонов пока нет: администратор ещё не загрузил справочник.',
      [
        ...templates.map((t) => [
          btn(
            cut(`${t.name} · ${complexesCount(t._count.complexes)}`, 48),
            `pr:copy:${t.id}`,
          ),
        ]),
        [btn('⬅️ Программы', 'pr:list')],
      ],
    );
  }

  private async programScreen(
    ctx: BotContext,
    programId: number,
  ): Promise<MessengerMessage> {
    const program = await this.programs.find(ctx.user.id, programId);
    const active = ctx.profile.activeProgramId === program.id;
    const lines = program.complexes.map(
      (c, index) =>
        `${index + 1}. ${c.name} — ${exercisesCount(c.exercises.length)}${cardioText(c) ? ' + кардио' : ''}`,
    );
    return msg(
      [
        `Программа «${program.name}»${active ? ' ✅ активная' : ''}`,
        '',
        lines.length
          ? lines.join('\n')
          : 'Комплексов пока нет — добавь первый.',
      ].join('\n'),
      [
        ...program.complexes.map((c) => [btn(cut(c.name), `cx:v:${c.id}`)]),
        [btn('➕ Комплекс', `pr:addc:${program.id}`)],
        ...(active
          ? []
          : [[btn('✅ Сделать активной', `pr:act:${program.id}`)]]),
        [
          btn('✏️ Переименовать', `pr:ren:${program.id}`),
          btn('📤 Поделиться', `fr:share:${program.id}`),
        ],
        [
          btn('🗑 Удалить', `pr:del:${program.id}`),
          btn('⬅️ Программы', 'pr:list'),
        ],
      ],
    );
  }

  private async complexScreen(
    ctx: BotContext,
    complexId: number,
  ): Promise<MessengerMessage> {
    const complex = await this.programs.findComplex(ctx.user.id, complexId);
    const lines = complex.exercises.map(
      (item, index) =>
        `${index + 1}. ${item.exercise.name} — ${planText(item.sets, item.repsMin, item.repsMax)}`,
    );
    const cardio = cardioText(complex);
    return msg(
      [
        `«${complex.name}» — ${exercisesCount(complex.exercises.length)}`,
        `Программа: ${complex.program.name}`,
        '',
        lines.length
          ? lines.join('\n')
          : 'Упражнений пока нет — добавь первое.',
        ...(cardio ? [cardio] : []),
        '',
        hint(
          'Нажми на упражнение, чтобы поменять подходы, порядок или убрать.',
        ),
      ].join('\n'),
      [
        ...grid(
          complex.exercises.map((item, index) =>
            btn(
              cut(`${index + 1}. ${item.exercise.name}`, 28),
              `cx:e:${item.id}`,
            ),
          ),
          2,
        ),
        [
          btn('➕ Упражнение', `cx:add:${complex.id}`),
          btn('🏃 Кардио', `cx:cardio:${complex.id}`),
        ],
        [
          btn('⬆️ Выше', `cx:up:${complex.id}`),
          btn('⬇️ Ниже', `cx:dn:${complex.id}`),
        ],
        [
          btn('✏️ Переименовать', `cx:ren:${complex.id}`),
          btn('🗑 Удалить', `cx:del:${complex.id}`),
        ],
        [btn('⬅️ Программа', `pr:v:${complex.programId}`)],
      ],
    );
  }

  private async itemScreen(
    ctx: BotContext,
    itemId: number,
  ): Promise<MessengerMessage> {
    const item = await this.programs.findItem(ctx.user.id, itemId);
    return msg(
      `${item.exercise.name} — ${planText(item.sets, item.repsMin, item.repsMax)}\nКомплекс: ${item.complex.name}`,
      [
        [btn('🔢 Подходы и повторы', `cx:plan:${item.id}`)],
        [
          btn('⬆️ Выше', `cx:eup:${item.id}`),
          btn('⬇️ Ниже', `cx:edn:${item.id}`),
        ],
        [
          btn('ℹ️ Техника', `ex:v:${item.exerciseId}`),
          btn('🗑 Убрать', `cx:erm:${item.id}`),
        ],
        [btn('⬅️ Комплекс', `cx:v:${item.complexId}`)],
      ],
    );
  }

  private async muscleListScreen(
    ctx: BotContext,
    complexId: number,
    muscleId: number,
    page: number,
  ): Promise<MessengerMessage> {
    const { items, meta } = await this.catalog.exercisesByMuscle(
      ctx.user.id,
      muscleId,
      page,
    );
    const nav: MessengerButton[] = [];
    if (meta.hasPrevPage)
      nav.push(btn('◀️', `cx:ml:${complexId}:${muscleId}:${page - 1}`));
    if (meta.hasNextPage)
      nav.push(btn('▶️', `cx:ml:${complexId}:${muscleId}:${page + 1}`));
    return msg(
      items.length
        ? `Выбери упражнение (стр. ${meta.page} из ${meta.totalPages}):`
        : 'На эту группу упражнений пока нет.',
      [
        ...items.map((e) => [
          btn(this.exerciseLabel(e), `cx:pick:${complexId}:${e.id}`),
        ]),
        ...(nav.length ? [nav] : []),
        [btn('⬅️ Мышцы', `cx:am:${complexId}`)],
      ],
    );
  }

  private exerciseLabel(exercise: { name: string; status: string }): string {
    return cut(`${exercise.status === 'DRAFT' ? '📝 ' : ''}${exercise.name}`);
  }
}
