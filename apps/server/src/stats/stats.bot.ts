import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

import {
  BACK_TO_MENU,
  BotContext,
  BotFeature,
  BotHandler,
  btn,
  cut,
  msg,
} from '@/bot';
import { MessengerMessage } from '@/messengers';

import { StatsService } from './stats.service';

/** Статистика: посещаемость, серия, нагрузка по мышцам, график прогресса весов. */
@Injectable()
@BotHandler({ prefixes: ['ss'], commands: ['stats'] })
export class StatsBot implements BotFeature {
  constructor(private readonly stats: StatsService) {}

  public async onCommand(ctx: BotContext): Promise<void> {
    await ctx.reply(await this.screen(ctx));
  }

  public async onCallback(
    ctx: BotContext,
    _prefix: string,
    action: string,
    args: string[],
  ): Promise<void> {
    switch (action) {
      case 'menu':
        return ctx.edit(await this.screen(ctx));
      case 'prog': {
        const exercises = await this.stats.progressExercises(ctx.user.id);
        return ctx.edit(
          exercises.length
            ? msg('📈 По какому упражнению показать график?', [
                ...exercises.map((e) => [btn(cut(e.name), `ss:pg:${e.id}`)]),
                [btn('⬅️ Статистика', 'ss:menu')],
              ])
            : msg(
                'Графиков пока нет: нужны хотя бы две тренировки с записанными весами по одному упражнению. Веса записываются во время тренировки.',
                [[btn('⬅️ Статистика', 'ss:menu')]],
              ),
        );
      }
      case 'pg':
        return this.sendChart(ctx, ctx.user.id, Number(args[0]));
      case 'ok':
        if (!(await ctx.remove())) await ctx.toast('👌');
        return;
      default:
        return ctx.toast('Кнопка устарела');
    }
  }

  /**
   * График картинкой с кнопкой «Ок», убирающей его из чата (общая и для графика друга);
   * временный файл удаляется после отправки.
   */
  public async sendChart(
    ctx: BotContext,
    userId: number,
    exerciseId: number,
  ): Promise<void> {
    const chart = await this.stats.progressChart(userId, exerciseId);
    if (!chart) return ctx.toast('Недостаточно данных для графика');
    try {
      await ctx.reply({
        text: chart.caption,
        image: { path: chart.file },
        buttons: [[btn('👌 Ок', 'ss:ok')]],
      });
    } finally {
      fs.rmSync(chart.file, { force: true });
    }
  }

  private async screen(ctx: BotContext): Promise<MessengerMessage> {
    const lines = await this.stats.summaryLines(ctx.profile, {
      withMonth: true,
    });
    return msg(['📊 Статистика', '', ...lines].join('\n'), [
      [btn('📈 Прогресс весов', 'ss:prog')],
      [BACK_TO_MENU],
    ]);
  }
}
