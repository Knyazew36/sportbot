import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { LinkChannelDto } from './dto/link-channel.dto';
import { LinkCodeResponseDto } from './dto/link-code.response.dto';
import { LinkNotifyDto } from './dto/link-notify.dto';
import { LinkStateResponseDto } from './dto/link-state.response.dto';
import { LinkAppService } from './link-app.service';

@ApiTags('link')
@Controller('link')
@SportAuth()
export class LinkController {
  constructor(private readonly linkAppService: LinkAppService) {}

  @Get('state')
  @Swagger({
    title: 'Привязанные мессенджеры и куда писать',
    response: LinkStateResponseDto,
    bearerAuth: true,
  })
  public state(@CurrentUser('id') userId: number) {
    return this.linkAppService.state(userId);
  }

  @Post('code/create')
  @Swagger({
    title: 'Ссылка для привязки второго мессенджера',
    response: LinkCodeResponseDto,
    bearerAuth: true,
  })
  public createCode(@CurrentUser('id') userId: number) {
    return this.linkAppService.createCode(userId);
  }

  @Post('unlink')
  @Swagger({
    title: 'Отвязать мессенджер (когда привязаны оба)',
    body: LinkChannelDto,
    response: LinkStateResponseDto,
    bearerAuth: true,
  })
  public unlink(
    @CurrentUser('id') userId: number,
    @Body() dto: LinkChannelDto,
  ) {
    return this.linkAppService.unlink(userId, dto.channel);
  }

  @Post('notify')
  @Swagger({
    title: 'Куда присылать вопросы и напоминания',
    body: LinkNotifyDto,
    response: LinkStateResponseDto,
    bearerAuth: true,
  })
  public notify(@CurrentUser('id') userId: number, @Body() dto: LinkNotifyDto) {
    return this.linkAppService.notify(userId, dto.channels);
  }
}
