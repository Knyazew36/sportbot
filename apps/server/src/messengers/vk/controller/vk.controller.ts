import {
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';

import type { MessengerUser } from '../../messenger.types';
import { MessengerApi } from '../../messenger-api.decorator';

import { VkLinkService } from '../deeplink/vk-link.service';
import { VkLoginService } from '../deeplink/vk-login.service';
import { VkMessagesAllowedService } from '../dialog/vk-messages-allowed.service';
import { VkLinkStartResponseDto } from '../dto/vk-link-start-response.dto';
import { VkLoginStartResponseDto } from '../dto/vk-login-start-response.dto';
import { VkLoginStatusQueryDto } from '../dto/vk-login-status-query.dto';
import { VkLoginStatusResponseDto } from '../dto/vk-login-status-response.dto';
import { VkMessagesAllowedResponseDto } from '../dto/vk-messages-allowed-response.dto';
import { VkPublicConfigResponseDto } from '../dto/vk-public-config-response.dto';
import { VkHostAuthGuard } from '../guards/vk-host-auth.guard';
import { VK_INTEGRATION_OPTIONS } from '../vk.constants';
import { VkIntegrationOptions } from '../vk.types';

type AuthedRequest = Request & { user?: MessengerUser };

/**
 * HTTP-эндпоинты модуля VK. Пути — по образцу модулей MAX и Telegram (auth/…, user/me/…).
 * Подтверждения входа/привязки здесь нет намеренно — оно происходит только кнопкой в чате
 * сообщества (см. VkBotUpdate).
 */
@ApiTags('vk')
@Controller()
export class VkController {
  constructor(
    @Inject(VK_INTEGRATION_OPTIONS)
    private readonly options: VkIntegrationOptions,
    private readonly loginService: VkLoginService,
    private readonly linkService: VkLinkService,
    private readonly messagesAllowedService: VkMessagesAllowedService,
  ) {}

  // ── Конфиг для мини-приложения (публичный) ──────────────────────────────

  @Get('vk/public-config')
  @MessengerApi({
    title:
      'Публичный конфиг VK: id сообщества и мини-приложения (нужны фронту до входа)',
    response: VkPublicConfigResponseDto,
  })
  public publicConfig(): VkPublicConfigResponseDto {
    return { groupId: this.options.groupId, appId: this.options.appId ?? null };
  }

  // ── Вход через VK (публичные) ───────────────────────────────────────────

  @Post('auth/vk-login/start')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @MessengerApi({
    title:
      'Вход через VK: ссылка на чат с сообществом, где вход подтверждается кнопкой',
    response: VkLoginStartResponseDto,
  })
  public startLogin() {
    return this.loginService.start();
  }

  @Get('auth/vk-login/status')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @MessengerApi({
    title:
      'Статус входа через VK — браузер поллит, пока пользователь подтверждает в чате',
    response: VkLoginStatusResponseDto,
  })
  public loginStatus(@Query() query: VkLoginStatusQueryDto) {
    return this.loginService.status(query.token);
  }

  // ── Привязка VK и разрешение на сообщения (нужна сессия) ────────────────

  @Post('user/me/link-vk/start')
  @UseGuards(VkHostAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @MessengerApi({
    title:
      'Привязка VK к текущему аккаунту: ссылка на чат с сообществом, где привязка подтверждается кнопкой',
    response: VkLinkStartResponseDto,
  })
  public startLink(@Req() req: AuthedRequest) {
    if (!req.user) throw new UnauthorizedException('Требуется авторизация');
    return this.linkService.start(req.user.id);
  }

  @Post('user/me/vk/messages-allowed/sync')
  @UseGuards(VkHostAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @MessengerApi({
    title:
      'Сверить с VK, разрешил ли текущий пользователь сообщения от сообщества (после VKWebAppAllowMessagesFromGroup)',
    response: VkMessagesAllowedResponseDto,
  })
  public syncMessagesAllowed(@Req() req: AuthedRequest) {
    if (!req.user) throw new UnauthorizedException('Требуется авторизация');
    return this.messagesAllowedService.sync(req.user);
  }
}
