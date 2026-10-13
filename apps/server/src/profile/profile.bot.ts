import { Injectable } from '@nestjs/common';

import {
  BACK_TO_MENU,
  BOT_CHANNEL_TITLE,
  BotContext,
  BotFeature,
  BotHandler,
  BotSessionService,
  BotSessionState,
  botStartLink,
  btn,
  cut,
  grid,
  msg,
  numEmoji,
  otherBotChannel,
  parseUserTime,
  WEEKDAY_ORDER,
  WEEKDAY_SHORT,
  hint,
} from '@/bot';
import { SportProfile, WeightAskFrequency } from '@/generated/prisma/client';
import { MessengerButton, MessengerMessage } from '@/messengers';
import { ProgramService } from '@/program/program.service';

import {
  CITY_ZONES,
  ONBOARDING_STEPS,
  ProfileService,
} from './profile.service';

const WEIGHT_FREQUENCY_TITLE: Record<WeightAskFrequency, string> = {
  OFF: 'выключен',
  WEEKLY: 'раз в неделю',
  BIWEEKLY: 'раз в две недели',
  MONTHLY: 'раз в месяц',
};

const zoneTitle = (zone: string): string =>
  CITY_ZONES.find((city) => city.zone === zone)?.title ??
  // Etc/GMT-5 — это UTC+5: знак у Etc обратный
  zone.replace(/^Etc\/GMT([+-]?)(\d*)$/, (_m, sign: string, hours: string) =>
    hours ? `UTC${sign === '-' ? '+' : '−'}${hours}` : 'UTC',
  );

const daysTitle = (days: number[]): string =>
  days.length
    ? WEEKDAY_ORDER.filter((d) => days.includes(d))
        .map((d) => WEEKDAY_SHORT[d])
        .join(', ')
    : 'не выбраны';

/**
 * Первый запуск (префикс `ob`) и настройки (префикс `st`). Экраны общие: отличаются только
 * префиксом кнопок и тем, куда ведёт выход — на следующий шаг или обратно в настройки.
 */
@Injectable()
@BotHandler({ prefixes: ['ob', 'st'], commands: ['settings'] })
export class ProfileBot implements BotFeature {
  constructor(
    private readonly profiles: ProfileService,
    private readonly programs: ProgramService,
    private readonly sessions: BotSessionService,
  ) {}

  public async onCommand(ctx: BotContext, command: string): Promise<void> {
    if (command === 'settings') {
      await ctx.reply(this.settingsScreen(ctx.profile));
      return;
    }
    // Сюда роутер приводит любого, кто не закончил первый запуск
    // Приветствие сменяется шагами по кнопке «Далее» (ob:show)
    if (ctx.profile.onboardingStep === 1) {
      await ctx.reply(this.welcomeScreen(ctx.profile));
      return;
    }
    await ctx.reply(await this.stepScreen(ctx.profile));
  }

  public async onCallback(
    ctx: BotContext,
    prefix: string,
    action: string,
    args: string[],
  ): Promise<void> {
    const userId = ctx.user.id;
    const onboarding = prefix === 'ob';
    await this.sessions.clear(ctx);

    switch (action) {
      // ── общее ──
      case 'tz': {
        if (args[0] === undefined)
          return ctx.edit(this.zoneScreen(ctx.profile));
        const city = CITY_ZONES[Number(args[0])];
        if (!city) return ctx.toast('Кнопка устарела');
        ctx.profile = await this.profiles.update(userId, {
          timeZone: city.zone,
        });
        return ctx.edit(this.settingsScreen(ctx.profile));
      }
      case 'tzt':
        await this.sessions.set(ctx, 'st.tz');
        return ctx.edit(
          msg(
            `Сколько у тебя сейчас времени?\n${hint('Напиши, например «14:30».')}`,
            [[btn('Отмена', 'st:menu')]],
          ),
        );
      case 'days':
        return ctx.edit(this.daysScreen(ctx.profile, prefix));
      case 'day': {
        ctx.profile = await this.profiles.update(userId, {
          trainingDays: this.profiles.toggleDay(
            ctx.profile.trainingDays,
            Number(args[0]),
          ),
        });
        return ctx.edit(this.daysScreen(ctx.profile, prefix));
      }
      case 'time':
        return ctx.edit(this.timeScreen(ctx.profile, prefix));
      case 'mt':
      case 'et':
        await this.sessions.set(ctx, `${prefix}.${action}`);
        return ctx.edit(
          msg(
            action === 'mt'
              ? `Во сколько спрашивать утром «будешь тренироваться?»\n${hint('Напиши время, например «8:00».')}`
              : `Во сколько спрашивать вечером «потренировался?»\n${hint('Напиши время, например «20:30».')}`,
            [[btn('Отмена', onboarding ? 'ob:show' : 'st:time')]],
          ),
        );

      // ── первый запуск ──
      case 'show':
        return ctx.edit(await this.stepScreen(ctx.profile));
      case 'next':
        return this.advance(ctx, Number(args[0]));
      case 'tpl':
        await this.programs.copy(Number(args[0]), userId);
        return this.advance(ctx, 3);
      case 'scratch':
        await this.programs.create(userId, 'Моя программа');
        return this.advance(ctx, 3);

      // ── настройки ──
      case 'menu':
        return ctx.edit(this.settingsScreen(ctx.profile));
      case 'wf': {
        if (args[0] === undefined)
          return ctx.edit(
            msg('Как часто спрашивать вес тела?', [
              ...(
                Object.keys(WEIGHT_FREQUENCY_TITLE) as WeightAskFrequency[]
              ).map((value) => [
                btn(
                  `${ctx.profile.weightAskFrequency === value ? '✅ ' : ''}${WEIGHT_FREQUENCY_TITLE[value]}`,
                  `st:wf:${value}`,
                ),
              ]),
              [btn('⬅️ Настройки', 'st:menu')],
            ]),
          );
        if (!(args[0] in WEIGHT_FREQUENCY_TITLE))
          return ctx.toast('Кнопка устарела');
        ctx.profile = await this.profiles.update(userId, {
          weightAskFrequency: args[0] as WeightAskFrequency,
        });
        return ctx.edit(this.settingsScreen(ctx.profile));
      }
      case 'name':
        await this.sessions.set(ctx, 'st.name');
        return ctx.edit(
          msg(`Как тебя показывать друзьям?\n${hint('Напиши имя.')}`, [
            [btn('Отмена', 'st:menu')],
          ]),
        );
      case 'del':
        return ctx.edit(
          msg(
            'Удалить все твои данные? Сотрётся профиль, программы, история тренировок, вес тела, ограничения, друзья и черновики. Вернуть будет нельзя.\n\nКопии программ, которые ты раздал друзьям, у них останутся.',
            [
              [btn('Да, удалить всё', 'st:delok')],
              [btn('Нет, оставить', 'st:menu')],
            ],
          ),
        );
      case 'delok':
        await this.profiles.deleteAccount(userId);
        return ctx.edit(
          msg(
            'Данные удалены. Захочешь вернуться — нажми /start, начнём с нуля.',
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
    const userId = ctx.user.id;
    const [prefix, field] = session.state.split('.');
    const text = ctx.text ?? '';

    if (field === 'tz') {
      ctx.profile = await this.profiles.update(userId, {
        timeZone: this.profiles.zoneFromLocalTime(text),
      });
      await this.sessions.clear(ctx);
      await ctx.reply(this.settingsScreen(ctx.profile));
      return;
    }

    if (field === 'mt' || field === 'et') {
      const time = parseUserTime(text);
      if (!time) {
        await ctx.reply(
          msg('Не понял время. Напиши, например «8:00» или «20:30».'),
        );
        return;
      }
      ctx.profile = await this.profiles.update(
        userId,
        field === 'mt' ? { morningTime: time } : { eveningTime: time },
      );
      await this.sessions.clear(ctx);
      await ctx.reply(this.timeScreen(ctx.profile, prefix));
      return;
    }

    if (field === 'name') {
      const name = text.trim().slice(0, 64);
      if (!name) {
        await ctx.reply(msg('Имя не может быть пустым.'));
        return;
      }
      ctx.profile = await this.profiles.update(userId, { displayName: name });
      await this.sessions.clear(ctx);
      await ctx.reply(this.settingsScreen(ctx.profile));
    }
  }

  // ── Первый запуск ───────────────────────────────────────────────────────

  /**
   * «Далее» с шага fromStep. Номер шага приходит в кнопке: нажатие под старым сообщением
   * не перескакивает через шаг.
   */
  private async advance(ctx: BotContext, fromStep: number): Promise<void> {
    const userId = ctx.user.id;
    if (ctx.profile.onboardedAt || ctx.profile.onboardingStep !== fromStep) {
      await ctx.edit(await this.stepScreen(ctx.profile));
      return;
    }
    // Шаг программы без выбора: значение по умолчанию — первый шаблон
    if (fromStep === 3 && !ctx.profile.activeProgramId) {
      const fresh = await this.profiles.update(userId, {});
      if (!fresh.activeProgramId) {
        const [template] = await this.programs.templates();
        if (template) await this.programs.copy(template.id, userId);
      }
    }
    if (fromStep < ONBOARDING_STEPS) {
      ctx.profile = await this.profiles.update(userId, {
        onboardingStep: fromStep + 1,
      });
      await ctx.edit(await this.stepScreen(ctx.profile));
      return;
    }
    ctx.profile = await this.profiles.update(userId, {
      onboardedAt: new Date(),
    });
    // Второй мессенджер предлагаем, только если бот в нём подключён и он ещё не привязан
    const there = otherBotChannel(ctx.channel);
    const other = BOT_CHANNEL_TITLE[there];
    const canLink =
      !!botStartLink(there, '') &&
      !ctx.user[there === 'TELEGRAM' ? 'telegramId' : 'maxId'];
    await ctx.edit(
      msg(
        [
          '🎉 Готово, настройка закончена!',
          '',
          `🌍 Часовой пояс: ${zoneTitle(ctx.profile.timeZone)}`,
          `📅 Тренировочные дни: ${daysTitle(ctx.profile.trainingDays)}`,
          `⏰ Вопросы: утром в ${ctx.profile.morningTime}, вечером в ${ctx.profile.eveningTime}`,
          '',
          '🔔 В тренировочные дни я сам спрошу про тренировку.',
          '🚀 Начать прямо сейчас — /today. Всё остальное — в меню.',
          ...(canLink
            ? [
                '',
                `🔗 Пользуешься ещё и ${other}? Привяжи его — будет один аккаунт:`,
                '• общие программы, история тренировок и настройки;',
                '• отмечать тренировки можно в любом из двух мессенджеров;',
                '• сам выберешь, куда присылать вопросы и напоминания.',
                '',
                `Как привязать: нажми кнопку ниже, открой ссылку в ${other} и подтверди там привязку.`,
                hint(
                  'Ссылка одноразовая, действует 15 минут. Сделать это позже: Настройки → Мессенджеры.',
                ),
              ]
            : []),
        ].join('\n'),
        [
          ...(canLink ? [[btn(`🔗 Привязать ${other}`, 'ln:new')]] : []),
          [BACK_TO_MENU],
        ],
      ),
    );
  }

  private welcomeScreen(profile: SportProfile): MessengerMessage {
    return msg(
      [
        `👋 Привет, ${profile.displayName}!`,
        '',
        'Я твой помощник для тренировок в зале 💪 Вот что умею:',
        '',
        '📋 Храню программу — готовый шаблон или твоя собственная, с комплексами по дням.',
        '🏋️ Выдаю комплекс на день и веду по упражнениям: подходы, веса, прошлый результат.',
        '📚 Показываю технику упражнений и растяжек из справочника.',
        '🧘 Собираю заминку под мышцы, которые работали.',
        '⏰ Напоминаю о тренировке утром и спрашиваю вечером, как прошло.',
        '📊 Считаю посещаемость, серию и нагрузку по мышцам.',
        '⚖️ Слежу за весом тела.',
        '🦴 Учитываю ограничения и травмы, ⏸ ставлю паузу на отпуск или болезнь.',
        '👥 Помогаю делиться программой с друзьями.',
        '',
        `⚙️ Настроимся за ${ONBOARDING_STEPS} шага — это минута.`,
        hint('На каждом шаге можно просто нажать «Далее».'),
      ].join('\n'),
      [[btn('Далее ➡️', 'ob:show')]],
    );
  }

  /** Заголовок шага первого запуска: «2️⃣ Шаг 2 из 4 · ». В настройках заголовка нет. */
  private stepTitle(step: number, onboarding = true): string {
    return onboarding
      ? `${numEmoji(step)} Шаг ${step} из ${ONBOARDING_STEPS} · `
      : '';
  }

  private async stepScreen(profile: SportProfile): Promise<MessengerMessage> {
    switch (profile.onboardingStep) {
      case 1:
        return this.daysScreen(profile, 'ob');
      case 2:
        return this.timeScreen(profile, 'ob');
      default: {
        const templates = await this.programs.templates();
        return msg(
          `${this.stepTitle(3)}📋 Программа\n\n📦 Возьми готовый шаблон — потом его можно править.\n✍️ Или собери свою с нуля.${templates.length ? `\n${hint('«Далее» выберет первый шаблон.')}` : ''}`,
          [
            ...templates.map((t) => [
              btn(`📦 ${cut(t.name, 37)}`, `ob:tpl:${t.id}`),
            ]),
            [btn('✍️ С нуля', 'ob:scratch')],
            [btn('Далее ➡️', 'ob:next:3')],
          ],
        );
      }
    }
  }

  // ── Экраны ──────────────────────────────────────────────────────────────

  /** Часовой пояс — только в настройках: при первом запуске шага нет, по умолчанию Москва. */
  private zoneScreen(profile: SportProfile): MessengerMessage {
    return msg(
      `Часовой пояс.\n\nСейчас: ${zoneTitle(profile.timeZone)}.\n${hint('Выбери город с твоим временем или введи текущее время — пояс подберу сам.')}`,
      [
        ...grid(
          CITY_ZONES.map((city, index) =>
            btn(
              `${city.zone === profile.timeZone ? '✅ ' : ''}${city.title}`,
              `st:tz:${index}`,
            ),
          ),
          2,
        ),
        [btn('⌨️ Ввести текущее время', 'st:tzt')],
        [btn('⬅️ Настройки', 'st:menu')],
      ],
    );
  }

  private daysScreen(profile: SportProfile, prefix: string): MessengerMessage {
    const onboarding = prefix === 'ob';
    return msg(
      `${this.stepTitle(1, onboarding)}📅 Тренировочные дни\n\n🔔 В эти дни я буду спрашивать про тренировку.\n🗓 Сейчас: ${daysTitle(profile.trainingDays)}.\n${hint('Нажми на день, чтобы включить или выключить.')}`,
      [
        ...grid(
          WEEKDAY_ORDER.map((day) =>
            btn(
              `${profile.trainingDays.includes(day) ? '✅' : '▫️'} ${WEEKDAY_SHORT[day]}`,
              `${prefix}:day:${day}`,
            ),
          ),
          4,
        ),
        [
          onboarding
            ? btn('Далее ➡️', 'ob:next:1')
            : btn('⬅️ Настройки', 'st:menu'),
        ],
      ],
    );
  }

  private timeScreen(profile: SportProfile, prefix: string): MessengerMessage {
    const onboarding = prefix === 'ob';
    return msg(
      [
        `${this.stepTitle(2, onboarding)}⏰ Время опросов`,
        '',
        'В тренировочные дни я сам напишу тебе дважды:',
        `🌅 Утром в ${profile.morningTime} — спрошу «Будешь сегодня тренироваться?» и пришлю комплекс на день.`,
        `🌙 Вечером в ${profile.eveningTime} — спрошу «Потренировался?», чтобы засчитать тренировку.`,
        '',
        '🔁 Не ответишь утром — напомню один раз через 2 часа.',
        '😴 В остальные дни не беспокою.',
        hint('Время можно поменять кнопками ниже.'),
      ].join('\n'),
      [
        [
          btn('🌅 Изменить утро', `${prefix}:mt`),
          btn('🌙 Изменить вечер', `${prefix}:et`),
        ],
        [
          onboarding
            ? btn('Далее ➡️', 'ob:next:2')
            : btn('⬅️ Настройки', 'st:menu'),
        ],
      ],
    );
  }

  private settingsScreen(profile: SportProfile): MessengerMessage {
    const rows: MessengerButton[][] = [
      [btn('🌍 Часовой пояс', 'st:tz'), btn('📅 Дни', 'st:days')],
      [btn('⏰ Время вопросов', 'st:time'), btn('⚖️ Вопрос о весе', 'st:wf')],
      [btn('🙂 Имя', 'st:name'), btn('⏸ Пауза', 'pa:menu')],
      [btn('🦴 Ограничения', 'lm:menu'), btn('🗓 История отметок', 'pd:hist')],
      [btn('👥 Друзья', 'fr:menu'), btn('🔗 Мессенджеры', 'ln:menu')],
      [btn('🗑 Удалить мои данные', 'st:del')],
      [BACK_TO_MENU],
    ];
    return msg(
      [
        'Настройки',
        '',
        `Имя: ${profile.displayName}`,
        `Часовой пояс: ${zoneTitle(profile.timeZone)}`,
        `Тренировочные дни: ${daysTitle(profile.trainingDays)}`,
        `Вопросы: утром в ${profile.morningTime}, вечером в ${profile.eveningTime}`,
        `Вопрос о весе тела: ${WEIGHT_FREQUENCY_TITLE[profile.weightAskFrequency]}`,
      ].join('\n'),
      rows,
    );
  }
}
