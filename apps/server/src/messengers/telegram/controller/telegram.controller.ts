import {
  Controller,
  Get,
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

import { TelegramLinkService } from '../deeplink/telegram-link.service';
import { TelegramLoginService } from '../deeplink/telegram-login.service';
import { TelegramLinkStartResponseDto } from '../dto/telegram-link-start-response.dto';
import { TelegramLoginStartResponseDto } from '../dto/telegram-login-start-response.dto';
import { TelegramLoginStatusQueryDto } from '../dto/telegram-login-status-query.dto';
import { TelegramLoginStatusResponseDto } from '../dto/telegram-login-status-response.dto';
import { TelegramHostAuthGuard } from '../guards/telegram-host-auth.guard';

/**
 * HTTP-эндпоинты модуля Telegram. Пути — по образцу модуля MAX (auth/…, user/me/…).
 * Подтверждения входа/привязки здесь нет намеренно — оно происходит только кнопкой в чате бота
 * (см. TelegramBotUpdate).
 */
@ApiTags('telegram')
@Controller()
export class TelegramController {
  constructor(
    private readonly loginService: TelegramLoginService,
    private readonly linkService: TelegramLinkService,
  ) {}

  // ── Вход через Telegram (публичные) ─────────────────────────────────────

  @Post('auth/telegram-login/start')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @MessengerApi({
    title:
      'Вход через Telegram: ссылка на чат с ботом, где вход подтверждается кнопкой',
    response: TelegramLoginStartResponseDto,
  })
  public startLogin() {
    return this.loginService.start();
  }

  @Get('auth/telegram-login/status')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @MessengerApi({
    title:
      'Статус входа через Telegram — браузер поллит, пока пользователь подтверждает в чате',
    response: TelegramLoginStatusResponseDto,
  })
  public loginStatus(@Query() query: TelegramLoginStatusQueryDto) {
    return this.loginService.status(query.token);
  }

  // ── Привязка Telegram (нужна сессия) ────────────────────────────────────

  @Post('user/me/link-telegram/start')
  @UseGuards(TelegramHostAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @MessengerApi({
    title:
      'Привязка Telegram к текущему аккаунту: ссылка на чат с ботом, где привязка подтверждается кнопкой',
    response: TelegramLinkStartResponseDto,
  })
  public startLink(@Req() req: Request & { user?: MessengerUser }) {
    if (!req.user) throw new UnauthorizedException('Требуется авторизация');
    return this.linkService.start(req.user.id);
  }
}
