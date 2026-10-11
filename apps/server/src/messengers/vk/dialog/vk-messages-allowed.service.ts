import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import type { MessengerUser } from '../../messenger.types';
import { VkBotService } from '../bot/vk-bot.service';
import { VK_LOG_EMOJI } from '../vk.constants';

import { VkDialogService } from './vk-dialog.service';

/**
 * Сверка «разрешил ли пользователь сообщения от сообщества» с самим VK.
 *
 * Мини-приложение просит разрешение через VKWebAppAllowMessagesFromGroup, но событие message_allow
 * приходит не всегда (разрешение дано раньше, Long Poll был недоступен). Флагу с клиента не верим —
 * после запроса разрешения фронт зовёт сверку, и сервер спрашивает VK ключом сообщества.
 */
@Injectable()
export class VkMessagesAllowedService {
  private readonly logger = new Logger(
    `${VK_LOG_EMOJI} ${VkMessagesAllowedService.name}`,
  );

  constructor(
    private readonly botService: VkBotService,
    private readonly dialogService: VkDialogService,
  ) {}

  // ── Сверка ──────────────────────────────────────────────────────────────

  public async sync(
    user: Pick<MessengerUser, 'id' | 'vkId'>,
  ): Promise<{ allowed: boolean }> {
    if (!user.vkId) throw new BadRequestException('Аккаунт не привязан к VK');

    this.logger.log(
      `Сверка разрешения на сообщения: userId=${user.id}, vkId=${user.vkId}`,
    );
    let allowed: boolean;
    try {
      allowed = await this.botService.isMessagesAllowed(user.vkId);
    } catch (error) {
      this.logger.warn(
        `VK не ответил на сверку: userId=${user.id}: ${(error as Error).message}`,
      );
      throw new BadRequestException(
        'VK не ответил на проверку разрешения, попробуйте позже',
      );
    }

    if (allowed) await this.dialogService.markStarted(user.vkId);
    else await this.dialogService.markClosed(user.vkId);
    this.logger.log(
      `Сообщения от сообщества ${allowed ? 'разрешены' : 'не разрешены'}: userId=${user.id}`,
    );
    return { allowed };
  }
}
