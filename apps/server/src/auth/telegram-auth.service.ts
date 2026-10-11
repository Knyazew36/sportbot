import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'

import { upsertTelegramUserFromWidget } from '@/common/telegram/upsert-telegram-user'
import { PrismaService } from 'prisma/prisma.service'

import { TelegramWidgetAuthDto } from './dto/telegram-widget.dto'

/**
 * Вход/регистрация через Telegram Login Widget (обычная веб-кнопка на /login, /register) —
 * в отличие от Telegram Mini App (TelegramAuthStrategy из messengers/telegram), не требует
 * запуска сайта внутри Telegram. Upsert по тому же полю User.telegramId/telegramData.
 */
@Injectable()
export class TelegramAuthService {
  private readonly logger = new Logger(`✈️ ${TelegramAuthService.name}`)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public async loginWithWidget(dto: TelegramWidgetAuthDto) {
    const botToken = this.configService.get<string>('TG_BOT_TOKEN') ?? ''
    if (!botToken) {
      throw new UnauthorizedException('Telegram Login Widget не сконфигурирован')
    }

    const user = await upsertTelegramUserFromWidget(this.prisma, dto, botToken)
    this.logger.log(`✅ Вход через Telegram Login Widget: userId=${user.id}, telegramId=${dto.id}`)

    return this.buildAuthResponse(user.id)
  }

  private async buildAuthResponse(userId: number) {
    const accessToken = await this.jwtService.signAsync({ sub: userId, provider: 'telegram' })
    return { accessToken, user: { id: userId } }
  }
}
