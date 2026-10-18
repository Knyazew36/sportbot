import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { BotChannel } from '@/generated/prisma/client';
import { AuthChannel } from '@/miniapp/decorators/auth-channel.decorator';
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { CreateRenderJobDto } from './dto/create-render-job.dto';
import { ListRenderJobsQueryDto } from './dto/list-render-jobs.query.dto';
import { RenderJobResponseDto } from './dto/render-job.response.dto';
import { RenderService } from './render.service';

// Рендер роликов из приложения: любая композиция контракта @sportbot/render-contract
@ApiTags('render')
@Controller('render')
@SportAuth()
export class RenderController {
  constructor(private readonly renderService: RenderService) {}

  @Post('jobs')
  @Swagger({
    title:
      'Заказать ролик: задача встаёт в очередь, статус — GET render/jobs/:id',
    body: CreateRenderJobDto,
    response: RenderJobResponseDto,
    bearerAuth: true,
  })
  public create(
    @CurrentUser('id') userId: number,
    @AuthChannel() channel: BotChannel | null,
    @Body() dto: CreateRenderJobDto,
  ) {
    return this.renderService.create(userId, channel, dto);
  }

  @Get('jobs')
  @Swagger({
    title: 'Свои файлы ролика за срок хранения: готовые и в работе',
    query: ListRenderJobsQueryDto,
    response: RenderJobResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public list(
    @CurrentUser('id') userId: number,
    @Query() query: ListRenderJobsQueryDto,
  ) {
    return this.renderService.list(userId, query.compositionId);
  }

  @Get('jobs/:id')
  @Swagger({
    title: 'Статус своей задачи рендера и ссылка на готовый файл',
    param: { name: 'id', type: Number },
    response: RenderJobResponseDto,
    bearerAuth: true,
  })
  public findOne(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.renderService.findOwn(userId, id);
  }
}
