import { Injectable } from '@nestjs/common';

import {
  BACK_TO_MENU,
  BotContext,
  BotFeature,
  BotHandler,
  BotSessionService,
  BotSessionState,
  btn,
  fmtDay,
  localToday,
  msg,
  parseUserDate,
  hint,
} from '@/bot';
import { Pause } from '@/generated/prisma/client';
import { MessengerMessage } from '@/messengers';

import { PauseService } from './pause.service';

/** Пауза: ручная и по предложению бота, окончание и продление. */
@Injectable()
@BotHandler({ prefixes: ['pa'], commands: ['pause'] })
export class PauseBot implements BotFeature {
  constructor(
    private readonly pauses: PauseService,
    private readonly sessions: BotSessionService,
  ) {}

  public async onCommand(ctx: BotContext): Promise<void> {
    await ctx.reply(await this.menu(ctx));
  }

  public async onCallback(
    ctx: BotContext,
    _prefix: string,
    action: string,
    args: string[],
  ): Promise<void> {
    await this.sessions.clear(ctx);
    // s — согласие на предложение бота после трёх пропусков, иначе пауза ручная
    const origin = args[0] === 's' ? 'SUGGESTED' : 'MANUAL';
    switch (action) {
      case 'menu':
        return ctx.edit(await this.menu(ctx));
      case 'until':
        await this.sessions.set(ctx, 'pa.until', { origin });
        return ctx.edit(
          msg(
            `До какой даты пауза?\n${hint('Напиши, например «25.11» — в этот день я ещё молчу.')}`,
            [[btn('Отмена', 'pa:menu')]],
          ),
        );
      case 'forever': {
        const pause = await this.pauses.start(ctx.profile, null, origin);
        return ctx.edit(this.started(pause));
      }
      case 'ext':
        return ctx.edit(
          msg('На сколько продлить паузу?', [
            [btn('До даты', 'pa:until:m'), btn('До отмены', 'pa:forever:m')],
            [btn('Не продлевать', 'pa:end')],
          ]),
        );
      case 'end': {
        const ended = await this.pauses.end(ctx.profile);
        return ctx.edit(
          msg(
            ended
              ? 'Паузу снял. В тренировочные дни снова буду спрашивать про тренировку.'
              : 'Паузы и так нет.',
            [[BACK_TO_MENU]],
          ),
        );
      }
      case 'no':
        return ctx.edit(msg('Хорошо, продолжаем без паузы.'));
      default:
        return ctx.toast('Кнопка устарела');
    }
  }

  public async onText(
    ctx: BotContext,
    session: BotSessionState,
  ): Promise<void> {
    const today = localToday(ctx.profile.timeZone);
    const date = parseUserDate(ctx.text ?? '', today);
    if (!date || date < today) {
      await ctx.reply(
        msg('Не понял дату. Напиши будущую дату, например «25.11».'),
      );
      return;
    }
    await this.sessions.clear(ctx);
    const pause = await this.pauses.start(
      ctx.profile,
      date,
      session.data.origin === 'SUGGESTED' ? 'SUGGESTED' : 'MANUAL',
    );
    await ctx.reply(this.started(pause));
  }

  // ── Экраны ──────────────────────────────────────────────────────────────

  private started(pause: Pause): MessengerMessage {
    return msg(
      `Пауза ${pause.endDate ? `до ${fmtDay(pause.endDate)}` : 'до отмены'}. Вопросов не будет, дни не считаются пропусками, серия заморожена.`,
      [[btn('Снять паузу', 'pa:end')], [BACK_TO_MENU]],
    );
  }

  private async menu(ctx: BotContext): Promise<MessengerMessage> {
    const pause = await this.pauses.active(ctx.profile);
    if (pause)
      return msg(
        `Сейчас пауза: с ${fmtDay(pause.startDate)} ${pause.endDate ? `до ${fmtDay(pause.endDate)}` : 'до отмены'}.`,
        [
          [btn('Снять паузу', 'pa:end'), btn('Изменить срок', 'pa:ext')],
          [BACK_TO_MENU],
        ],
      );
    return msg(
      'Пауза — для отпуска, болезни или травмы. Пока она действует, я не задаю вопросов, дни не считаются пропусками, а серия не сгорает.',
      [
        [btn('До даты', 'pa:until:m'), btn('До отмены', 'pa:forever:m')],
        [BACK_TO_MENU],
      ],
    );
  }
}
