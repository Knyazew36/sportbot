import { Injectable, Logger } from '@nestjs/common';

import { MessengerUser, MessengerUserStore } from '../../messenger.types';
import { MAX_LOG_EMOJI } from '../max.constants';

import {
  isMaxDialogOpen,
  withMaxDialogClosed,
  withMaxDialogStarted,
} from './max-dialog.state';

/**
 * Открыт ли у пользователя чат с ботом — то есть можно ли ему сейчас что-то отправить в MAX.
 * Подробно о том, зачем это нужно, — в max-dialog.state.ts.
 *
 * Использование снаружи модуля: перед отправкой уведомления проверить canDeliver(user).
 * Отмечать открытие/закрытие вручную не нужно — это делают MaxBotUpdate (события чата)
 * и MaxBotService (ошибка dialog.not.found при отправке).
 */
@Injectable()
export class MaxDialogService {
  private readonly logger = new Logger(
    `${MAX_LOG_EMOJI} ${MaxDialogService.name}`,
  );

  constructor(private readonly users: MessengerUserStore) {}

  // ── Проверка ────────────────────────────────────────────────────────────

  /** Есть ли куда слать: MAX привязан и чат с ботом открыт. */
  public canDeliver(user: Pick<MessengerUser, 'maxId' | 'data'>): boolean {
    return !!user.maxId && isMaxDialogOpen(user.data);
  }

  // ── Смена состояния ─────────────────────────────────────────────────────

  /**
   * Чат открыт. Для незнакомого maxId заводим пользователя сразу: тот же upsert по maxId сделает
   * MaxAuthStrategy при первом заходе в мини-приложение, а без строки сейчас флаг потерялся бы,
   * и уведомления не шли бы, хотя чат открыт. Такой «голый» пользователь при привязке к
   * веб-аккаунту сливается в него (MaxAppAdapter.linkAccount).
   */
  public async markStarted(maxId: number | string): Promise<MessengerUser> {
    const id = String(maxId);
    const existing = await this.users.findByExternalId('MAX', id);
    const data = withMaxDialogStarted(existing?.data);
    const user = await this.users.upsertByExternalId('MAX', id, { data });
    this.logger.log(
      `Чат с ботом открыт: maxId=${id}, userId=${user.id}${existing ? '' : ' (новый пользователь)'}`,
    );
    return user;
  }

  /** Чат закрыт. Незнакомый maxId игнорируем — заводить под него пользователя незачем. */
  public async markClosed(maxId: number | string): Promise<void> {
    const id = String(maxId);
    const existing = await this.users.findByExternalId('MAX', id);
    if (!existing) {
      this.logger.debug(`Чат закрыт незнакомым maxId=${id} — пропускаю`);
      return;
    }
    await this.users.update(existing.id, 'MAX', {
      data: withMaxDialogClosed(existing.data),
    });
    this.logger.log(`Чат с ботом закрыт: maxId=${id}, userId=${existing.id}`);
  }
}
