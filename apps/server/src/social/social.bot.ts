import { Injectable } from '@nestjs/common';

import {
  BACK_TO_MENU,
  BotContext,
  BotFeature,
  BotHandler,
  btn,
  cut,
  msg,
  hint,
} from '@/bot';
import { link, MessengerMessage } from '@/messengers';
import { StatsBot } from '@/stats/stats.bot';
import { StatsService } from '@/stats/stats.service';

import { SocialService } from './social.service';

const BACK = [btn('⬅️ Друзья', 'fr:menu')];

/** Друзья: приглашение ссылкой, статистика друга, обмен программой. */
@Injectable()
@BotHandler({ prefixes: ['fr'], commands: ['friends'], startPayloads: ['fr'] })
export class SocialBot implements BotFeature {
  constructor(
    private readonly social: SocialService,
    private readonly stats: StatsService,
    private readonly statsBot: StatsBot,
  ) {}

  public async onCommand(ctx: BotContext): Promise<void> {
    await ctx.reply(await this.menu(ctx));
  }

  /** Переход по ссылке-приглашению `start=fr_<code>`. */
  public async onStart(ctx: BotContext, code: string): Promise<void> {
    const invite = await this.social.findInvite(code);
    if (!invite) {
      await ctx.reply(
        msg('⌛ Приглашение устарело или уже использовано.', [[BACK_TO_MENU]]),
      );
      return;
    }
    if (invite.senderId === ctx.user.id) {
      await ctx.reply(
        msg('🙂 Это твоя собственная ссылка — отправь её другу.', [
          [BACK_TO_MENU],
        ]),
      );
      return;
    }
    await ctx.reply(
      msg(
        `🤝 ${invite.sender.sportProfile?.displayName ?? 'Пользователь'} зовёт в друзья. Друзья видят тренировки, серию, нагрузку и веса друг друга; вес тела — нет.`,
        [[btn('Принять', `fr:acc:${invite.id}`), btn('Отклонить', 'fr:skip')]],
      ),
    );
  }

  public async onCallback(
    ctx: BotContext,
    _prefix: string,
    action: string,
    args: string[],
  ): Promise<void> {
    const userId = ctx.user.id;
    const id = Number(args[0]);
    switch (action) {
      case 'menu':
        return ctx.edit(await this.menu(ctx));
      case 'inv': {
        const links = await this.social.createInvite(userId);
        return ctx.edit(
          msg(
            [
              '🤝 Отправь другу приглашение',
              ...(links.telegram
                ? [`✈️ Telegram: ${link('ссылка', links.telegram)}`]
                : []),
              ...(links.max ? [`💬 MAX: ${link('ссылка', links.max)}`] : []),
              hint(
                '⏳ Ссылка одноразовая и живёт 7 дней.',
              ),
            ].join('\n\n'),
            [BACK],
          ),
        );
      }
      case 'acc': {
        const name = await this.social.acceptInvite(ctx.profile, id);
        return ctx.edit(
          msg(`🎉 Готово: ${name} теперь у тебя в друзьях.`, [BACK]),
        );
      }
      case 'skip':
        return ctx.edit(msg('👌 Хорошо.'));
      case 'v':
        return ctx.edit(
          msg(await this.social.friendCard(userId, id), [
            [btn('📈 Прогресс весов', `fr:pl:${id}`)],
            [btn('Разорвать дружбу', `fr:rm:${id}`)],
            BACK,
          ]),
        );
      case 'pl': {
        await this.social.friendProfile(userId, id);
        const exercises = await this.stats.progressExercises(id);
        return ctx.edit(
          exercises.length
            ? msg('📈 По какому упражнению показать график?', [
                ...exercises.map((e) => [
                  btn(cut(e.name), `fr:pg:${id}:${e.id}`),
                ]),
                [btn('⬅️ Назад', `fr:v:${id}`)],
              ])
            : msg('🤷 У друга пока нет записанных весов.', [
                [btn('⬅️ Назад', `fr:v:${id}`)],
              ]),
        );
      }
      case 'pg':
        await this.social.friendProfile(userId, id);
        return this.statsBot.sendChart(ctx, id, Number(args[1]));
      case 'rm':
        await this.social.unfriend(userId, id);
        await ctx.toast('Дружба разорвана');
        return ctx.edit(await this.menu(ctx));

      // ── обмен программой ──
      case 'share': {
        const friends = await this.social.friends(userId);
        return ctx.edit(
          friends.length
            ? msg('📤 С кем поделиться программой? Друг получит свою копию.', [
                ...friends.map((f) => [
                  btn(
                    cut(f.sportProfile?.displayName ?? 'Друг'),
                    `fr:sh:${id}:${f.id}`,
                  ),
                ]),
                [btn('⬅️ Программа', `pr:v:${id}`)],
              ])
            : msg('🤷 Делиться пока не с кем — сначала пригласи друга.', [
                [btn('➕ Пригласить друга', 'fr:inv')],
                [btn('⬅️ Программа', `pr:v:${id}`)],
              ]),
        );
      }
      case 'sh': {
        const name = await this.social.shareProgram(
          ctx.profile,
          id,
          Number(args[1]),
        );
        return ctx.edit(
          msg(`📨 Отправил предложение: ${name}.`, [
            [btn('⬅️ Программа', `pr:v:${id}`)],
          ]),
        );
      }
      case 'take': {
        const program = await this.social.takeProgram(userId, id);
        return ctx.edit(
          msg(
            `✅ Программа «${program.name}» скопирована. Личные упражнения автора пришли как твои черновики с пометкой «не проверено».`,
            [[btn('Открыть программу', `pr:v:${program.id}`)]],
          ),
        );
      }
      case 'upd':
        await this.social.updateCopy(userId, id);
        return ctx.edit(
          msg('🔄 Программа обновлена до версии автора.', [
            [btn('Открыть программу', `pr:v:${id}`)],
          ]),
        );
      case 'keep':
        await this.social.keepCopy(userId, id);
        return ctx.edit(msg('👌 Оставил как есть.'));
      default:
        return ctx.toast('Кнопка устарела');
    }
  }

  private async menu(ctx: BotContext): Promise<MessengerMessage> {
    const friends = await this.social.friends(ctx.user.id);
    return msg(
      friends.length
        ? `👥 Твои друзья.\n${hint('Нажми на имя, чтобы посмотреть тренировки и нагрузку.')}`
        : '👥 Друзей пока нет. Пригласи друга ссылкой — будете видеть тренировки, серию и веса друг друга.',
      [
        ...friends.map((f) => [
          btn(cut(f.sportProfile?.displayName ?? 'Друг'), `fr:v:${f.id}`),
        ]),
        [btn('➕ Пригласить друга', 'fr:inv')],
        [BACK_TO_MENU],
      ],
    );
  }
}
