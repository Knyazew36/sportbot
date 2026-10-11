import { Injectable, Logger } from '@nestjs/common';

import { MessengerUser, MessengerUserStore } from '../../messenger.types';
import { TELEGRAM_LOG_EMOJI } from '../telegram.constants';
import { TelegramUserInfo } from '../telegram.types';

import {
  isTelegramDialogOpen,
  withTelegramDialogClosed,
  withTelegramDialogStarted,
} from './telegram-dialog.state';

/**
 * Может ли бот сейчас что-то отправить пользователю в Telegram.
 * Подробно о том, зачем это нужно, — в telegram-dialog.state.ts.
 *
 * Использование снаружи модуля: перед отправкой уведомления проверить canDeliver(user).
 * Отмечать открытие/закрытие вручную не нужно — это делают TelegramBotUpdate (события чата)
 * и TelegramBotService (403 при отправке).
 */
@Injectable()
export class TelegramDialogService {
  private readonly logger = new Logger(
    `${TELEGRAM_LOG_EMOJI} ${TelegramDialogService.name}`,
  );

  constructor(private readonly users: MessengerUserStore) {}

  // ── Проверка ────────────────────────────────────────────────────────────

  /** Есть ли куда слать: Telegram привязан и бот не заблокирован. */
  public canDeliver(user: Pick<MessengerUser, 'telegramId' | 'data'>): boolean {
    return !!user.telegramId && isTelegramDialogOpen(user.data);
  }

  // ── Смена состояния ─────────────────────────────────────────────────────

  /**
   * Чат открыт. Для незнакомого telegramId заводим пользователя сразу: тот же upsert по telegramId
   * сделает TelegramAuthStrategy при первом заходе в мини-приложение, а без строки сейчас флаг
   * потерялся бы. Такой «голый» пользователь при привязке к веб-аккаунту сливается в него
   * (TelegramAppAdapter.linkAccount).
   *
   * profile — профиль из апдейта: обновляем telegramData, чтобы имя/username не устаревали.
   * Сливаем, а не затираем: в апдейтах бота нет photo_url, который приходит из initData.
   */
  public async markStarted(
    telegramId: number | string,
    profile?: TelegramUserInfo,
  ): Promise<MessengerUser> {
    const id = String(telegramId);
    const existing = await this.users.findByExternalId('TELEGRAM', id);
    const data = withTelegramDialogStarted(existing?.data);
    const previousProfile =
      existing?.telegramData &&
      typeof existing.telegramData === 'object' &&
      !Array.isArray(existing.telegramData)
        ? existing.telegramData
        : {};
    const telegramData = profile
      ? ({ ...previousProfile, ...profile } as Record<string, unknown>)
      : undefined;
    const user = await this.users.upsertByExternalId('TELEGRAM', id, {
      data,
      profile: telegramData,
    });
    this.logger.log(
      `Бот может писать: telegramId=${id}, userId=${user.id}${existing ? '' : ' (новый пользователь)'}`,
    );
    return user;
  }

  /** Бот заблокирован. Незнакомый telegramId игнорируем — заводить под него пользователя незачем. */
  public async markClosed(telegramId: number | string): Promise<void> {
    const id = String(telegramId);
    const existing = await this.users.findByExternalId('TELEGRAM', id);
    if (!existing) {
      this.logger.debug(
        `Бот заблокирован незнакомым telegramId=${id} — пропускаю`,
      );
      return;
    }
    await this.users.update(existing.id, 'TELEGRAM', {
      data: withTelegramDialogClosed(existing.data),
    });
    this.logger.log(
      `Бот заблокирован: telegramId=${id}, userId=${existing.id}`,
    );
  }
}
