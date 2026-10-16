import { Injectable, Logger } from '@nestjs/common';

import {
  BACK_TO_MENU,
  BotContext,
  BotFeature,
  BotHandler,
  linkBtn,
  msg,
} from '@/bot';
import { formatZonedDate } from '@/common/utils/zoned-time';

import { StarsService } from './stars.service';

const SUPPORT_HANDLE = '@Knyaz_sv';
const SUPPORT_URL = 'https://t.me/Knyaz_sv';

const TERMS = `📄 Условия использования

1. Бот и приложение бесплатны. Тренировки, программы и статистика доступны без оплаты.
2. Звёзды Telegram — добровольная поддержка разработчика. За них ничего не открывается, подписки и повторных списаний нет.
3. Ошибочную оплату вернём: напиши ${SUPPORT_HANDLE} с номером оплаты из /paysupport.
4. Мы храним то, что нужно для работы: профиль, расписание, тренировки, вес тела и id аккаунта в мессенджере. Данные не продаём и не передаём третьим лицам.
5. Удалить все свои данные можно в приложении: Профиль → Аккаунт → «Удаление данных».
6. Советы бота — не медицинская рекомендация. При болях и ограничениях по здоровью посоветуйся с врачом.

Вопросы — ${SUPPORT_HANDLE}.`;

/**
 * /paysupport и /terms — обязательные команды для ботов с оплатой (правила Telegram для разработчиков ботов).
 * /paysupport показывает номера последних оплат: по ним поддержка найдёт платёж и при необходимости вернёт звёзды
 */
@Injectable()
@BotHandler({ prefixes: ['sp'], commands: ['paysupport', 'terms'] })
export class StarsBot implements BotFeature {
  private readonly logger = new Logger(`⭐ ${StarsBot.name}`);

  constructor(private readonly stars: StarsService) {}

  public async onCommand(ctx: BotContext, command: string): Promise<void> {
    if (command === 'terms') {
      this.logger.log(`/terms от userId=${ctx.user.id}, ${ctx.channel}`);
      await ctx.reply(msg(TERMS, [[BACK_TO_MENU]]));
      return;
    }

    const payments = await this.stars.recentPaid(ctx.user.id);
    this.logger.log(
      `/paysupport от userId=${ctx.user.id}, ${ctx.channel}: оплат ${payments.length}`,
    );

    const list = payments.length
      ? `\n\nТвои последние оплаты:\n${payments
          .map(
            (p) =>
              `№${p.id} — ${p.amount} ⭐${p.paidAt ? `, ${formatZonedDate(p.paidAt, { day: 'numeric', month: 'long' })}` : ''}${p.status === 'REFUNDED' ? ' (возвращено)' : ''}`,
          )
          .join('\n')}`
      : '';

    await ctx.reply(
      msg(
        `⭐ Поддержка по оплате

Звёзды в приложении — добровольная поддержка разработчика: за них ничего не открывается и не списывается повторно.

Если оплата прошла по ошибке или что-то пошло не так — напиши ${SUPPORT_HANDLE} и укажи номер оплаты. Разберёмся и при необходимости вернём звёзды.${list}`,
        [[linkBtn(`✉️ Написать ${SUPPORT_HANDLE}`, SUPPORT_URL)], [BACK_TO_MENU]],
      ),
    );
  }
}
