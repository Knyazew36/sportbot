import { Injectable } from '@nestjs/common';

import { BotHandler } from './bot-handler.decorator';
import { BotSessionService } from './bot-session.service';
import {
  AdminIdentity,
  BotContext,
  BotFeature,
  btn,
  isAdmin,
  msg,
} from './bot.types';

/** Команды бота: регистрируются в меню обоих мессенджеров при старте. */
export const BOT_COMMANDS: { name: string; description: string }[] = [
  { name: 'today', description: 'Тренировка сегодня' },
  { name: 'programs', description: 'Программы и комплексы' },
  { name: 'catalog', description: 'Справочник упражнений и растяжек' },
  { name: 'stats', description: 'Статистика' },
  { name: 'history', description: 'Отметки за 7 дней' },
  { name: 'weight', description: 'Вес тела' },
  { name: 'pause', description: 'Пауза' },
  { name: 'friends', description: 'Друзья' },
  { name: 'settings', description: 'Настройки' },
  { name: 'menu', description: 'Главное меню' },
  { name: 'cancel', description: 'Отменить ввод' },
];

const HELP = `Я веду твои тренировки в зале.

/today — выдать комплекс на сегодня
/programs — программы и комплексы
/catalog — упражнения и растяжки с техникой
/stats — посещаемость, серия, нагрузка по мышцам
/history — исправить отметку за последние 7 дней
/weight — записать вес тела
/pause — пауза на отпуск или болезнь
/friends — друзья и обмен программой
/settings — дни, время вопросов, часовой пояс
/cancel — отменить текущий ввод`;

@Injectable()
@BotHandler({
  prefixes: ['mn'],
  commands: ['start', 'menu', 'help', 'cancel'],
})
export class MenuBot implements BotFeature {
  constructor(private readonly sessions: BotSessionService) {}

  public async onCommand(ctx: BotContext, command: string): Promise<void> {
    if (command === 'help') {
      await ctx.reply(msg(HELP, [[btn('⬅️ Меню', 'mn:main')]]));
      return;
    }
    if (command === 'cancel') await ctx.reply(msg('Ввод отменён.'));
    await ctx.reply(mainMenuMessage(ctx.user));
  }

  public async onCallback(
    ctx: BotContext,
    _prefix: string,
    action: string,
  ): Promise<void> {
    await this.sessions.clear(ctx);
    if (action === 'help') {
      await ctx.edit(msg(HELP, [[btn('⬅️ Меню', 'mn:main')]]));
      return;
    }
    await ctx.edit(mainMenuMessage(ctx.user));
  }
}

/** Главное меню. Общее для команды /menu и экранов, которые в него возвращают. */
export function mainMenuMessage(user: AdminIdentity) {
  return msg('Главное меню', [
    [btn('🏋️ Тренировка сегодня', 'wo:today')],
    [btn('📋 Программы', 'pr:list'), btn('📚 Справочник', 'ex:menu')],
    // «История» (исправление отметок) — в настройках: в основном меню она не нужна каждый день
    [btn('📊 Статистика', 'ss:menu'), btn('⚖️ Вес тела', 'bw:menu')],
    [btn('👥 Друзья', 'fr:menu'), btn('⚙️ Настройки', 'st:menu')],
    [btn('❓ Помощь', 'mn:help')],
    ...(isAdmin(user) ? [[btn('🛠 Админ', 'ad:menu')]] : []),
  ]);
}
