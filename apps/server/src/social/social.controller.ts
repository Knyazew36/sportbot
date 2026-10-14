import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { BotChannel } from '@/generated/prisma/client';
import { AuthChannel } from '@/miniapp/decorators/auth-channel.decorator';
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { FriendInviteResponseDto } from './dto/friend-invite.response.dto';
import { FriendProfileResponseDto } from './dto/friend-profile.response.dto';
import { FriendResponseDto } from './dto/friend.response.dto';
import { ProgramCopyResponseDto } from './dto/program-copy.response.dto';
import { SocialAppService } from './social-app.service';

const ID_PARAM = { name: 'id', type: Number };

@ApiTags('social')
@Controller('social')
@SportAuth()
export class SocialController {
  constructor(private readonly socialAppService: SocialAppService) {}

  @Get('friends')
  @Swagger({
    title: 'Друзья: серия, тренировался ли сегодня',
    response: FriendResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public friends(@CurrentUser('id') userId: number) {
    return this.socialAppService.friends(userId);
  }

  @Post('invite/create')
  @Swagger({
    title: 'Ссылка-приглашение в друзья',
    response: FriendInviteResponseDto,
    bearerAuth: true,
  })
  public invite(
    @CurrentUser('id') userId: number,
    @AuthChannel() channel: BotChannel | null,
  ) {
    return this.socialAppService.invite(userId, channel);
  }

  @Post('unfriend/:id')
  @Swagger({
    title: 'Удалить из друзей',
    param: ID_PARAM,
    bearerAuth: true,
  })
  public unfriend(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.socialAppService.unfriend(userId, id);
  }

  @Post('copy/:id')
  @Swagger({
    title: '«Скопировать себе» программу друга',
    param: { ...ID_PARAM, description: 'Программа друга' },
    response: ProgramCopyResponseDto,
    bearerAuth: true,
  })
  public copyProgram(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.socialAppService.copyProgram(userId, id);
  }

  @Get('friends/:id')
  @Swagger({
    title: 'Профиль друга: серия, пауза, программы',
    param: ID_PARAM,
    response: FriendProfileResponseDto,
    bearerAuth: true,
  })
  public friend(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.socialAppService.friend(userId, id);
  }
}
