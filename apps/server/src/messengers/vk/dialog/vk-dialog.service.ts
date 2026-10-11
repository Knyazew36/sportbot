import { Injectable, Logger } from '@nestjs/common';

import { MessengerUser, MessengerUserStore } from '../../messenger.types';
import { VK_LOG_EMOJI } from '../vk.constants';
import { VkUserInfo } from '../vk.types';

import {
  isVkDialogOpen,
  withVkDialogClosed,
  withVkDialogStarted,
} from './vk-dialog.state';

/**
 * Может ли сообщество сейчас что-то отправить пользователю в VK.
 * Подробно о том, зачем это нужно, — в vk-dialog.state.ts.
 *
 * Использование снаружи модуля: перед отправкой уведомления проверить canDeliver(user).
 * Отмечать открытие/закрытие вручную не нужно — это делают VkBotUpdate (события сообщества),
 * VkBotService (ошибка 901 при отправке) и сверка разрешения из мини-приложения.
 */
@Injectable()
export class VkDialogService {
  private readonly logger = new Logger(
    `${VK_LOG_EMOJI} ${VkDialogService.name}`,
  );

  constructor(private readonly users: MessengerUserStore) {}

  // ── Проверка ────────────────────────────────────────────────────────────

  /** Есть ли куда слать: VK привязан и сообщения от сообщества разрешены. */
  public canDeliver(user: Pick<MessengerUser, 'vkId' | 'data'>): boolean {
    return !!user.vkId && isVkDialogOpen(user.data);
  }

  // ── Смена состояния ─────────────────────────────────────────────────────

  /**
   * Сообщения разрешены. Для незнакомого vkId заводим пользователя сразу: тот же upsert по vkId
   * сделает VkAuthStrategy при первом заходе в мини-приложение, а без строки сейчас флаг потерялся бы.
   * Такой «голый» пользователь при привязке к веб-аккаунту сливается в него (VkAppAdapter.linkAccount).
   *
   * profile — профиль из users.get: сливаем, а не затираем, чтобы не потерять поля из мини-приложения.
   */
  public async markStarted(
    vkId: number | string,
    profile?: VkUserInfo,
  ): Promise<MessengerUser> {
    const id = String(vkId);
    const existing = await this.users.findByExternalId('VK', id);
    const data = withVkDialogStarted(existing?.data);
    const previousProfile =
      existing?.vkData &&
      typeof existing.vkData === 'object' &&
      !Array.isArray(existing.vkData)
        ? existing.vkData
        : {};
    const vkData = profile
      ? ({ ...previousProfile, ...profile } as Record<string, unknown>)
      : undefined;
    const user = await this.users.upsertByExternalId('VK', id, {
      data,
      profile: vkData,
    });
    this.logger.log(
      `Сообщество может писать: vkId=${id}, userId=${user.id}${existing ? '' : ' (новый пользователь)'}`,
    );
    return user;
  }

  /** Сообщения запрещены. Незнакомый vkId игнорируем — заводить под него пользователя незачем. */
  public async markClosed(vkId: number | string): Promise<void> {
    const id = String(vkId);
    const existing = await this.users.findByExternalId('VK', id);
    if (!existing) {
      this.logger.debug(
        `Сообщения запрещены незнакомым vkId=${id} — пропускаю`,
      );
      return;
    }
    await this.users.update(existing.id, 'VK', {
      data: withVkDialogClosed(existing.data),
    });
    this.logger.log(
      `Сообщения от сообщества запрещены: vkId=${id}, userId=${existing.id}`,
    );
  }
}
