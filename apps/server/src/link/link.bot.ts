import { Injectable } from '@nestjs/common';

import {
  BACK_TO_MENU,
  BOT_CHANNEL_TITLE as TITLE,
  BotChannelKey,
  BotContext,
  BotFeature,
  BotHandler,
  BotSender,
  botStartLink,
  btn,
  DEFAULT_NOTIFY_CHANNEL,
  fmtDay,
  hint,
  linkBtn,
  msg,
  otherBotChannel,
  plural,
} from '@/bot';
import { MessengerButton, MessengerMessage } from '@/messengers';

import {
  AccountSummary,
  LINK_EXPIRED,
  LinkService,
  LinkSide,
} from './link.service';

const BACK = [btn('⬅️ Мессенджеры', 'ln:menu')];

/** Выбор доставки в payload кнопки: T — Telegram, M — MAX, B — оба. */
const NOTIFY_CHOICE: Record<string, BotChannelKey[]> = {
  T: ['TELEGRAM'],
  M: ['MAX'],
  B: ['TELEGRAM', 'MAX'],
};

/** Сторона в payload кнопки: a — аккаунт, создавший ссылку, b — открывший её. */
const sideOf = (letter: string | undefined): LinkSide =>
  letter === 'b' ? 'visitor' : 'owner';

/**
 * Привязка второго мессенджера: экран «Мессенджеры» в настройках, ссылка `start=ln_<code>`,
 * выбор аккаунта, если данные есть в обоих, и вопрос, куда писать.
 */
@Injectable()
@BotHandler({ prefixes: ['ln'], startPayloads: ['ln'] })
export class LinkBot implements BotFeature {
  constructor(
    private readonly links: LinkService,
    private readonly sender: BotSender,
  ) {}

  /** Ссылку привязки открыли во втором мессенджере. */
  public async onStart(ctx: BotContext, code: string): Promise<void> {
    const offer = await this.offer(ctx, code);
    await ctx.reply(offer);
  }

  public async onCallback(
    ctx: BotContext,
    _prefix: string,
    action: string,
    args: string[],
  ): Promise<void> {
    const userId = ctx.user.id;
    const there = otherBotChannel(ctx.channel);

    switch (action) {
      case 'menu':
        return ctx.edit(await this.menuScreen(ctx));
      case 'new': {
        const url = botStartLink(there, 'ln_');
        if (!url) return ctx.toast(`Бот в ${TITLE[there]} не подключён`);
        if ((await this.links.state(userId)).linked.includes(there))
          return ctx.edit(await this.menuScreen(ctx));
        const code = await this.links.createCode(userId, there);
        return ctx.edit(
          msg(
            `Открой ссылку в ${TITLE[there]} и подтверди привязку.\n${hint('Ссылка одноразовая и действует 15 минут. Никому её не пересылай.')}`,
            [[linkBtn(`Открыть ${TITLE[there]}`, `${url}${code}`)], BACK],
          ),
        );
      }

      // ── второй мессенджер: подтверждение ──
      case 'back':
        return ctx.edit(await this.offer(ctx, args[0] ?? ''));
      case 'no':
        await this.links.cancel(args[0] ?? '');
        return ctx.edit(msg('Хорошо, не привязываю.', [[BACK_TO_MENU]]));
      case 'ok':
      case 'keep':
      case 'del':
        return this.confirm(ctx, args[0] ?? '', sideOf(args[1]), action);

      // ── куда писать ──
      case 'nc':
        return ctx.edit(this.notifyScreen());
      case 'set': {
        const channels = NOTIFY_CHOICE[args[0]];
        if (!channels) return ctx.toast('Кнопка устарела');
        await this.links.setNotifyChannels(userId, channels);
        return ctx.edit(await this.menuScreen(ctx));
      }

      // ── отвязка ──
      case 'un':
        return ctx.edit(
          msg(
            `Отвязать ${TITLE[there]}? История и настройки останутся в этом аккаунте, а в ${TITLE[there]} бот начнёт с нуля.`,
            [
              [btn('Да, отвязать', 'ln:unok')],
              [btn('Нет, оставить', 'ln:menu')],
            ],
          ),
        );
      case 'unok':
        // Пока мессенджер ещё привязан — сказать в том чате, что произошло
        if (ctx.user[there === 'TELEGRAM' ? 'telegramId' : 'maxId'])
          await this.sender
            .sendVia(
              there,
              ctx.user,
              msg(
                `Этот ${TITLE[there]} отвязан от аккаунта. Нажми /start, чтобы начать здесь заново.`,
              ),
            )
            .catch(() => undefined);
        await this.links.unlink(userId, there);
        return ctx.edit(await this.menuScreen(ctx));
      default:
        return ctx.toast('Кнопка устарела');
    }
  }

  // ── Привязка ────────────────────────────────────────────────────────────

  /** Вопрос во втором мессенджере: простое подтверждение либо выбор, чей аккаунт оставить. */
  private async offer(
    ctx: BotContext,
    code: string,
  ): Promise<MessengerMessage> {
    const link = await this.links.findCode(code);
    if (!link) return msg(LINK_EXPIRED, [[BACK_TO_MENU]]);
    const refusal = this.links.refusal(
      link.user,
      ctx.user,
      link.channel,
      ctx.channel,
    );
    if (refusal) return msg(refusal, [[BACK_TO_MENU]]);

    const here = ctx.channel;
    const there = otherBotChannel(here);
    const [owner, visitor] = await Promise.all([
      this.links.summary(link.userId),
      this.links.summary(ctx.user.id),
    ]);
    const cancel = [btn('Отмена', `ln:no:${code}`)];
    const foreign = hint('Если ссылку прислал кто-то другой — нажми «Отмена».');

    if (!owner.empty && !visitor.empty)
      return msg(
        [
          'В обоих мессенджерах уже есть данные. Оставить можно один аккаунт — второй удалю без возможности вернуть.',
          '',
          this.summaryLine(there, owner),
          this.summaryLine(here, visitor),
          '',
          hint('Выбери, какой оставить.'),
          foreign,
        ].join('\n'),
        [
          [btn(`Оставить ${TITLE[there]}`, `ln:keep:${code}:a`)],
          [btn(`Оставить ${TITLE[here]}`, `ln:keep:${code}:b`)],
          cancel,
        ],
      );

    // Данные только с одной стороны — остаётся она; пусто везде — аккаунт, где создали ссылку
    const keepVisitor = owner.empty && !visitor.empty;
    return msg(
      [
        keepVisitor
          ? `Привязать ${TITLE[there]} к этому аккаунту? В ${TITLE[there]} данных пока нет — останутся тренировки и настройки отсюда.`
          : `Привязать этот ${TITLE[here]} к аккаунту «${owner.name}» из ${TITLE[there]}?`,
        hint(
          'После привязки история и настройки общие, пользоваться ботом можно в любом мессенджере.',
        ),
        foreign,
      ].join('\n'),
      [
        [btn('✅ Привязать', `ln:ok:${code}:${keepVisitor ? 'b' : 'a'}`)],
        cancel,
      ],
    );
  }

  private async confirm(
    ctx: BotContext,
    code: string,
    keep: LinkSide,
    action: string,
  ): Promise<void> {
    const link = await this.links.findCode(code);
    if (!link) return ctx.edit(msg(LINK_EXPIRED, [[BACK_TO_MENU]]));
    const here = ctx.channel;
    const there = otherBotChannel(here);
    const loser = await this.links.summary(
      keep === 'owner' ? ctx.user.id : link.userId,
    );

    // Без предупреждения стирается только пустой аккаунт
    if (action !== 'del' && !loser.empty) {
      const [lost, kept] = keep === 'owner' ? [here, there] : [there, here];
      return ctx.edit(
        msg(
          [
            `Останется аккаунт из ${TITLE[kept]}. Аккаунт из ${TITLE[lost]} «${loser.name}» будет удалён безвозвратно: ${this.counts(loser)}, вес тела, ограничения и черновики.`,
            '',
            'Точно?',
          ].join('\n'),
          [
            [
              btn(
                'Да, удалить и привязать',
                `ln:del:${code}:${keep === 'owner' ? 'a' : 'b'}`,
              ),
            ],
            [btn('⬅️ Назад', `ln:back:${code}`)],
          ],
        ),
      );
    }

    const result = await this.links.link({
      code,
      visitorId: ctx.user.id,
      here,
      keep,
    });
    await ctx.edit(
      msg(
        [
          `✅ Готово: ${TITLE.TELEGRAM} и ${TITLE.MAX} теперь один аккаунт.`,
          '',
          ...this.linkedLines(),
          ...(result.onboarded
            ? []
            : ['', hint('Нажми /start, чтобы настроить бота.')]),
        ].join('\n'),
      ),
    );
    await ctx.reply(this.notifyScreen());
    // В первый мессенджер — что привязка состоялась: это и подтверждение, и сигнал, если привязал не ты
    await this.sender
      .sendVia(
        there,
        result.keeper,
        msg(
          [
            keep === 'owner'
              ? `✅ ${TITLE[here]} привязан к твоему аккаунту.`
              : `✅ ${TITLE[here]} привязан. Остался аккаунт из ${TITLE[here]} — данные, которые были здесь, удалены.`,
            '',
            ...this.linkedLines(),
            '',
            hint(
              `Если это был не ты — отвяжи ${TITLE[here]}: Настройки → Мессенджеры.`,
            ),
          ].join('\n'),
          [BACK],
        ),
      )
      .catch(() => undefined);
  }

  // ── Экраны ──────────────────────────────────────────────────────────────

  private async menuScreen(ctx: BotContext): Promise<MessengerMessage> {
    const here = ctx.channel;
    const there = otherBotChannel(here);
    const state = await this.links.state(ctx.user.id);
    const both = state.linked.includes(there);
    const rows: MessengerButton[][] = [];
    if (both)
      rows.push(
        [btn('📨 Куда писать', 'ln:nc')],
        [btn(`Отвязать ${TITLE[there]}`, 'ln:un')],
      );
    else if (botStartLink(there, ''))
      rows.push([btn(`🔗 Привязать ${TITLE[there]}`, 'ln:new')]);
    rows.push([btn('⬅️ Настройки', 'st:menu')]);

    return msg(
      [
        'Мессенджеры',
        '',
        `${TITLE[here]}: привязан — ты сейчас здесь`,
        `${TITLE[there]}: ${both ? 'привязан' : 'не привязан'}`,
        '',
        ...(both
          ? [
              `Вопросы и напоминания: ${this.notifyTitle(state.notify)}`,
              hint('Отвечаю всегда там, где ты нажал кнопку.'),
            ]
          : [
              hint(
                `Привяжи ${TITLE[there]} — будет один аккаунт с общей историей в обоих мессенджерах.`,
              ),
            ]),
      ].join('\n'),
      rows,
    );
  }

  private notifyScreen(): MessengerMessage {
    return msg(
      `Куда присылать вопросы и напоминания?\n${hint(`Не выберешь — буду писать в ${TITLE[DEFAULT_NOTIFY_CHANNEL]}. Поменять можно в настройках.`)}`,
      [
        [btn(TITLE.TELEGRAM, 'ln:set:T'), btn(TITLE.MAX, 'ln:set:M')],
        [btn('В оба', 'ln:set:B')],
      ],
    );
  }

  /** Итог привязки в обоих чатах: старые экраны «Мессенджеры» выше в ленте не обновляются. */
  private linkedLines(): string[] {
    return [`${TITLE.TELEGRAM}: привязан`, `${TITLE.MAX}: привязан`];
  }

  private notifyTitle(channels: BotChannelKey[]): string {
    if (channels.length > 1) return 'в оба мессенджера';
    return `в ${TITLE[channels[0] ?? DEFAULT_NOTIFY_CHANNEL]}`;
  }

  private summaryLine(channel: BotChannelKey, account: AccountSummary): string {
    return `${TITLE[channel]} — «${account.name}»: ${this.counts(account)}, серия: ${account.streak}`;
  }

  private counts(account: AccountSummary): string {
    const workouts = `${account.workouts} ${plural(account.workouts, 'тренировка', 'тренировки', 'тренировок')}`;
    return [
      account.since ? `${workouts} с ${fmtDay(account.since)}` : workouts,
      `программ: ${account.programs}`,
      `друзей: ${account.friends}`,
    ].join(', ');
  }
}
