import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { BotChannel, User } from '@/generated/prisma/client';

import { AuthChannel } from './decorators/auth-channel.decorator';
import { SportAuth } from './decorators/sport-auth.decorator';
import { MiniappMeResponseDto } from './dto/miniapp-me.response.dto';
import { MiniappWriteAccessResponseDto } from './dto/miniapp-write-access.response.dto';
import { MiniappService } from './miniapp.service';

@ApiTags('miniapp')
@Controller('miniapp')
@SportAuth()
export class MiniappController {
  constructor(private readonly miniappService: MiniappService) {}

  @Get('me')
  @Swagger({
    title: 'Вход в Mini App: профиль, права, состояние первого запуска',
    response: MiniappMeResponseDto,
    bearerAuth: true,
  })
  public me(
    @CurrentUser() user: User,
    @AuthChannel() channel: BotChannel | null,
  ) {
    return this.miniappService.me(user, channel);
  }

  @Post('write-access')
  @Swagger({
    title: 'Пользователь разрешил боту писать (штатный запрос мессенджера)',
    response: MiniappWriteAccessResponseDto,
    bearerAuth: true,
  })
  public allowWriteAccess(
    @CurrentUser() user: User,
    @AuthChannel() channel: BotChannel | null,
  ) {
    return this.miniappService.allowWriteAccess(user, channel);
  }
}
