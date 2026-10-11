import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import { ENTITY_EMOJI } from '@/common/utils';
import { isDev } from '@/common/utils/is-dev';

import { renderCustomEmail } from './templates/custom-email';

// Персональные данные в логи не пишем: по маске письмо всё ещё находится grep'ом
const maskEmail = (email: string): string =>
  email.replace(/^(.).*(@.*)$/, '$1***$2');

@Injectable()
export class MailService {
  private readonly logger = new Logger(
    `${ENTITY_EMOJI.mail} ${MailService.name}`,
  );
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
    this.from = this.configService.getOrThrow<string>('MAIL_FROM');
  }

  async sendVerificationEmail(to: string, code: string): Promise<boolean> {
    // Resend в песочнице шлёт только на почту владельца аккаунта — в dev дублируем код в консоль
    if (isDev(this.configService)) {
      this.logger.log(
        `[DEV] Код подтверждения email для ${maskEmail(to)}: ${code}`,
      );
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Подтверждение email',
      html: renderCustomEmail({
        previewText: 'Код подтверждения email',
        heading: 'Подтверждение email',
        paragraphs: ['Код действителен 15 минут. Никому его не сообщайте.'],
        code,
      }),
    });

    if (error) {
      // Не роняем регистрацию из-за сбоя почтового провайдера — юзер сможет запросить письмо повторно.
      // Флаг доносит сбой до вызывающего кода, чтобы фронт мог показать предупреждение
      this.logger.error(
        `Не удалось отправить письмо подтверждения на ${maskEmail(to)}: ${JSON.stringify(error)}`,
      );
      return false;
    }

    this.logger.log(`Письмо подтверждения отправлено на ${maskEmail(to)}`);
    return true;
  }

  async sendPasswordResetEmail(to: string, code: string) {
    if (isDev(this.configService)) {
      this.logger.log(`[DEV] Код сброса пароля для ${maskEmail(to)}: ${code}`);
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Восстановление пароля',
      html: renderCustomEmail({
        previewText: 'Код для сброса пароля',
        heading: 'Восстановление пароля',
        paragraphs: [
          'Код действителен 15 минут. Если вы не запрашивали сброс пароля — проигнорируйте это письмо.',
        ],
        code,
      }),
    });

    if (error) {
      this.logger.error(
        `Не удалось отправить письмо сброса пароля на ${maskEmail(to)}: ${JSON.stringify(error)}`,
      );
      return;
    }
    this.logger.log(`Письмо сброса пароля отправлено на ${maskEmail(to)}`);
  }

  /** Кастомная рассылка на шаблоне custom-email — заголовок, абзацы, опциональная кнопка-CTA. */
  async sendCustomEmail(
    to: string,
    params: {
      subject: string;
      previewText: string;
      heading: string;
      paragraphs: string[];
      buttonLabel?: string;
      buttonUrl?: string;
    },
  ): Promise<boolean> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: params.subject,
      html: renderCustomEmail({
        previewText: params.previewText,
        heading: params.heading,
        paragraphs: params.paragraphs,
        buttonLabel: params.buttonLabel,
        buttonUrl: params.buttonUrl,
      }),
    });

    if (error) {
      this.logger.error(
        `Не удалось отправить кастомное письмо на ${maskEmail(to)}: ${JSON.stringify(error)}`,
      );
      return false;
    }

    this.logger.log(`Кастомное письмо отправлено на ${maskEmail(to)}`);
    return true;
  }

  /** Письмо-уведомление для NotificationsService на том же шаблоне custom-email. */
  async sendNotificationEmail(
    to: string,
    title: string,
    body: string,
  ): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: title,
      html: renderCustomEmail({
        previewText: title,
        heading: title,
        paragraphs: body.split('\n').filter(Boolean),
      }),
    });

    if (error) {
      this.logger.error(
        `Не удалось отправить письмо-уведомление на ${maskEmail(to)}: ${JSON.stringify(error)}`,
      );
      throw new Error(`Resend error: ${JSON.stringify(error)}`);
    }
    this.logger.log(`Письмо-уведомление отправлено на ${maskEmail(to)}`);
  }
}
