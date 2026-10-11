import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import { ENTITY_EMOJI } from '@/common/utils';
import { isDev } from '@/common/utils/is-dev';

import { renderCustomEmail } from './templates/custom-email';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
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
        `${ENTITY_EMOJI.mail} [DEV] Код подтверждения email для ${to}: ${code}`,
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
        `${ENTITY_EMOJI.mail} Не удалось отправить письмо подтверждения на ${to}: ${JSON.stringify(error)}`,
      );
      return false;
    }

    this.logger.log(
      `${ENTITY_EMOJI.mail} Письмо подтверждения отправлено на ${to}`,
    );
    return true;
  }

  async sendPasswordResetEmail(to: string, code: string) {
    if (isDev(this.configService)) {
      this.logger.log(
        `${ENTITY_EMOJI.mail} [DEV] Код сброса пароля для ${to}: ${code}`,
      );
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
        `${ENTITY_EMOJI.mail} Не удалось отправить письмо сброса пароля на ${to}: ${JSON.stringify(error)}`,
      );
      return;
    }
    this.logger.log(
      `${ENTITY_EMOJI.mail} Письмо сброса пароля отправлено на ${to}`,
    );
  }

  /** Кастомная рассылка на react-email шаблоне (CustomEmail) — заголовок, абзацы, опциональная кнопка-CTA. */
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
        `${ENTITY_EMOJI.mail} Не удалось отправить кастомное письмо на ${to}: ${JSON.stringify(error)}`,
      );
      return false;
    }

    this.logger.log(
      `${ENTITY_EMOJI.mail} Кастомное письмо отправлено на ${to}`,
    );
    return true;
  }

  /** Generic-шаблон для NotificationsService — тело события уведомления на CustomEmail. */
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
        `${ENTITY_EMOJI.mail} Не удалось отправить письмо-уведомление на ${to}: ${JSON.stringify(error)}`,
      );
      throw new Error(`Resend error: ${JSON.stringify(error)}`);
    }
    this.logger.log(
      `${ENTITY_EMOJI.mail} Письмо-уведомление отправлено на ${to}`,
    );
  }
}
