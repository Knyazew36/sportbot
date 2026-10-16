import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';

import { isAdmin } from '@/bot/bot.types';
import { paginatePrisma } from '@/common/prisma/prisma-paginate';
import { BotChannel, Prisma, User } from '@/generated/prisma/client';
import {
  TelegramBotService,
  TelegramPreCheckout,
  TelegramPreCheckoutResult,
  TelegramSuccessfulPayment,
} from '@/messengers/telegram';
import { PrismaService } from 'prisma/prisma.service';

import { CreateStarPaymentDto } from './dto/create-star-payment.dto';
import { StarInvoiceResponseDto } from './dto/star-invoice.response.dto';
import { StarPaymentQueryDto } from './dto/star-payment-query.dto';
import { StarPaymentResponseDto } from './dto/star-payment.response.dto';
import {
  parseStarPayload,
  STAR_PURPOSE_INVOICE,
  toStarPayload,
} from './stars.constants';

const PAYMENT_SELECT = {
  id: true,
  userId: true,
  amount: true,
  purpose: true,
  status: true,
  createdAt: true,
  paidAt: true,
  refundedAt: true,
} satisfies Prisma.StarPaymentSelect;

/**
 * Оплата звёздами Telegram: счёт для Mini App, подтверждение и запись оплаты из апдейтов бота, возврат.
 * Назначение платежа (purpose) — параметр, сам сервис не знает, за что платят.
 */
@Injectable()
export class StarsService {
  private readonly logger = new Logger(`⭐ ${StarsService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    // Telegram не подключён (нет env) — бота нет, счёт выставить нечем
    @Optional() private readonly telegramBot?: TelegramBotService,
  ) {}

  // ── Счёт ────────────────────────────────────────────────────────────────

  public async create(
    user: User,
    channel: BotChannel | null,
    dto: CreateStarPaymentDto,
  ): Promise<StarInvoiceResponseDto> {
    if (channel !== 'TELEGRAM' || !user.telegramId) {
      this.logger.warn(
        `Счёт в звёздах вне Telegram: userId=${user.id}, channel=${channel ?? '—'}`,
      );
      throw new BadRequestException('Звёзды принимаются только в Telegram');
    }
    if (!this.telegramBot) {
      this.logger.error(
        `Telegram не подключён, счёт не выставить: userId=${user.id}`,
      );
      throw new ServiceUnavailableException('Оплата сейчас недоступна');
    }

    const payment = await this.prisma.starPayment.create({
      data: { userId: user.id, amount: dto.amount, purpose: dto.purpose },
      select: { id: true },
    });
    let invoiceUrl: string;
    try {
      invoiceUrl = await this.telegramBot.createStarsInvoiceLink({
        ...STAR_PURPOSE_INVOICE[dto.purpose],
        payload: toStarPayload(payment.id),
        amount: dto.amount,
      });
    } catch {
      // Счёт не выставлен — платёж-сирота в PENDING не нужен
      await this.prisma.starPayment.delete({ where: { id: payment.id } });
      throw new ServiceUnavailableException(
        'Telegram не выставил счёт, попробуйте позже',
      );
    }

    this.logger.log(
      `Платёж создан: id=${payment.id}, userId=${user.id}, amount=${dto.amount}, purpose=${dto.purpose}`,
    );
    return { id: payment.id, invoiceUrl };
  }

  // ── Чтение ──────────────────────────────────────────────────────────────

  public async list(query: StarPaymentQueryDto) {
    const where: Prisma.StarPaymentWhereInput = {
      ...(query.filter_status ? { status: query.filter_status } : {}),
      ...(query.filter_userId ? { userId: query.filter_userId } : {}),
    };
    const result = await paginatePrisma(this.prisma.starPayment, {
      page: query.page,
      limit: query.limit,
      where,
      select: PAYMENT_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    this.logger.debug(
      `list status=${query.filter_status ?? '—'}, userId=${query.filter_userId ?? '—'}: ${result.meta.total}`,
    );
    return result;
  }

  /** Свой платёж — любому, чужой — только админу */
  public async findOne(
    user: User,
    id: number,
  ): Promise<StarPaymentResponseDto> {
    try {
      return (await this.prisma.starPayment.findFirstOrThrow({
        where: { id, ...(isAdmin(user) ? {} : { userId: user.id }) },
        select: PAYMENT_SELECT,
      })) as StarPaymentResponseDto;
    } catch (error) {
      throw this.notFound(error, 'Платёж не найден');
    }
  }

  /** Последние оплаты пользователя — номера для обращения в поддержку (/paysupport) */
  public recentPaid(userId: number) {
    return this.prisma.starPayment.findMany({
      where: { userId, status: { in: ['PAID', 'REFUNDED'] } },
      select: { id: true, amount: true, status: true, paidAt: true },
      orderBy: { paidAt: 'desc' },
      take: 5,
    });
  }

  // ── Возврат ─────────────────────────────────────────────────────────────

  public async refund(
    id: number,
    adminId: number,
  ): Promise<StarPaymentResponseDto> {
    if (!this.telegramBot)
      throw new ServiceUnavailableException('Telegram не подключён');

    let payment: {
      telegramChargeId: string | null;
      user: { telegramId: string | null };
    };
    try {
      payment = await this.prisma.starPayment.findFirstOrThrow({
        where: { id, status: 'PAID' },
        select: {
          telegramChargeId: true,
          user: { select: { telegramId: true } },
        },
      });
    } catch (error) {
      throw this.notFound(error, 'Оплаченный платёж не найден');
    }
    if (!payment.telegramChargeId || !payment.user.telegramId) {
      this.logger.error(
        `Возврат невозможен — нет chargeId или telegramId: id=${id}`,
      );
      throw new BadRequestException('Для этого платежа возврат невозможен');
    }

    try {
      await this.telegramBot.refundStarPayment(
        payment.user.telegramId,
        payment.telegramChargeId,
      );
    } catch (error) {
      throw new BadRequestException(
        `Telegram отказал в возврате: ${(error as Error).message}`,
      );
    }

    const refunded = (await this.prisma.starPayment.update({
      where: { id },
      data: { status: 'REFUNDED', refundedAt: new Date() },
      select: PAYMENT_SELECT,
    })) as StarPaymentResponseDto;
    this.logger.log(`Платёж возвращён: id=${id}, adminId=${adminId}`);
    return refunded;
  }

  // ── События бота ────────────────────────────────────────────────────────

  /** Счёт наш, ещё не оплачен, сумма та же и платит тот, кому выставлен — одной выборкой */
  public async checkPreCheckout(
    query: TelegramPreCheckout,
  ): Promise<TelegramPreCheckoutResult> {
    const id = parseStarPayload(query.payload);
    const found =
      id !== null &&
      query.currency === 'XTR' &&
      (await this.prisma.starPayment.findFirst({
        where: {
          id,
          status: 'PENDING',
          amount: query.amount,
          user: { telegramId: String(query.telegramId) },
        },
        select: { id: true },
      }));
    if (!found) {
      this.logger.warn(
        `pre_checkout отклонён: payload=${query.payload}, telegramId=${query.telegramId}, amount=${query.amount} ${query.currency}`,
      );
      return { ok: false, error: 'Счёт устарел — откройте оплату заново' };
    }
    return { ok: true };
  }

  public async markPaid(payment: TelegramSuccessfulPayment): Promise<void> {
    const id = parseStarPayload(payment.payload);
    if (id === null) {
      this.logger.error(
        `Оплата с чужим payload=${payment.payload}, chargeId=${payment.chargeId}`,
      );
      return;
    }
    try {
      await this.prisma.starPayment.update({
        where: { id, status: 'PENDING' },
        data: {
          status: 'PAID',
          telegramChargeId: payment.chargeId,
          paidAt: new Date(),
        },
      });
      this.logger.log(
        `Оплачено: id=${id}, telegramId=${payment.telegramId}, amount=${payment.amount}, chargeId=${payment.chargeId}`,
      );
    } catch (error) {
      // Повторная доставка апдейта: платёж уже PAID
      if (this.isNotFound(error)) {
        this.logger.warn(
          `Оплата id=${id} уже записана или платежа нет, chargeId=${payment.chargeId}`,
        );
        return;
      }
      throw error;
    }
  }

  // ── Вспомогательное ─────────────────────────────────────────────────────

  private isNotFound(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }

  private notFound(error: unknown, message: string): unknown {
    return this.isNotFound(error) ? new NotFoundException(message) : error;
  }
}
