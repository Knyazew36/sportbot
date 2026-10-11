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

import { MaxLinkService } from '../deeplink/max-link.service';
import { MaxLoginService } from '../deeplink/max-login.service';
import { MaxLinkStartResponseDto } from '../dto/max-link-start-response.dto';
import { MaxLoginStartResponseDto } from '../dto/max-login-start-response.dto';
import { MaxLoginStatusQueryDto } from '../dto/max-login-status-query.dto';
import { MaxLoginStatusResponseDto } from '../dto/max-login-status-response.dto';
import { MaxHostAuthGuard } from '../guards/max-host-auth.guard';

/**
 * HTTP-эндпоинты модуля MAX. Пути оставлены прежними (auth/…, user/me/…), чтобы фронт
 * и старые клиенты не менялись. Подтверждения входа/привязки здесь нет намеренно —
 * оно происходит только кнопкой в чате бота (см. MaxBotUpdate).
 */
@ApiTags('max')
@Controller()
export class MaxController {
  constructor(
    private readonly loginService: MaxLoginService,
    private readonly linkService: MaxLinkService,
  ) {}

  // ── Вход через MAX (публичные) ──────────────────────────────────────────

  @Post('auth/max-login/start')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @MessengerApi({
    title:
      'Вход через MAX: ссылка на чат с ботом, где вход подтверждается кнопкой',
    response: MaxLoginStartResponseDto,
  })
  public startLogin() {
    return this.loginService.start();
  }

  @Get('auth/max-login/status')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @MessengerApi({
    title:
      'Статус входа через MAX — браузер поллит, пока пользователь подтверждает в чате',
    response: MaxLoginStatusResponseDto,
  })
  public loginStatus(@Query() query: MaxLoginStatusQueryDto) {
    return this.loginService.status(query.token);
  }

  // ── Привязка MAX (нужна сессия) ─────────────────────────────────────────

  @Post('user/me/link-max/start')
  @UseGuards(MaxHostAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @MessengerApi({
    title:
      'Привязка MAX к текущему аккаунту: ссылка на чат с ботом, где привязка подтверждается кнопкой',
    response: MaxLinkStartResponseDto,
  })
  public startLink(@Req() req: Request & { user?: MessengerUser }) {
    if (!req.user) throw new UnauthorizedException('Требуется авторизация');
    return this.linkService.start(req.user.id);
  }
}
