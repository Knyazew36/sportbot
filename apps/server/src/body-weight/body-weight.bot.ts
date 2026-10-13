import { Injectable } from '@nestjs/common';

import {
  BACK_TO_MENU,
  BotContext,
  BotFeature,
  BotHandler,
  BotSessionService,
  btn,
  fmtShort,
  msg,
  hint,
} from '@/bot';
import { MessengerMessage } from '@/messengers';

import { BodyWeightService } from './body-weight.service';

/** Вес тела: приватные данные, не видны ни друзьям, ни группе. */
@Injectable()
@BotHandler({ prefixes: ['bw'], commands: ['weight'] })
export class BodyWeightBot implements BotFeature {
  constructor(
    private readonly weights: BodyWeightService,
    private readonly sessions: BotSessionService,
  ) {}

  public async onCommand(ctx: BotContext): Promise<void> {
    await this.sessions.set(ctx, 'bw.value');
    await ctx.reply(await this.screen(ctx));
  }

  public async onCallback(
    ctx: BotContext,
    _prefix: string,
    action: string,
  ): Promise<void> {
    if (action === 'skip') {
      await this.sessions.clear(ctx);
      return ctx.edit(msg('Хорошо, спрошу в следующий раз.'));
    }
    await this.sessions.set(ctx, 'bw.value');
    await ctx.edit(await this.screen(ctx));
  }

  public async onText(ctx: BotContext): Promise<void> {
    const value = await this.weights.record(ctx.profile, ctx.text ?? '');
    await this.sessions.clear(ctx);
    await ctx.reply(
      msg(`Записал: ${value} кг.`, [
        [btn('⚖️ История веса', 'bw:menu')],
        [BACK_TO_MENU],
      ]),
    );
  }

  private async screen(ctx: BotContext): Promise<MessengerMessage> {
    const recent = await this.weights.recent(ctx.user.id);
    return msg(
      [
        'Вес тела. Эти данные вижу только я: друзьям они не показываются.',
        '',
        recent.length
          ? recent
              .map((w) => `${fmtShort(w.date)} — ${Number(w.value)} кг`)
              .join('\n')
          : 'Записей пока нет.',
        '',
        hint('Напиши текущий вес числом, например «78.5».'),
      ].join('\n'),
      [[btn('⚙️ Опрашивать периодически', 'st:wf')], [BACK_TO_MENU]],
    );
  }
}
