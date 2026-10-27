import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { SyncCatalogResponseDto } from './dto/sync-catalog.response.dto';
import { SyncPullQueryDto } from './dto/sync-pull.query.dto';
import { SyncPullResponseDto } from './dto/sync-pull.response.dto';
import { SyncPushDto } from './dto/sync-push.dto';
import { SyncPushResponseDto } from './dto/sync-push.response.dto';
import { SyncCatalogService } from './sync-catalog.service';
import { SyncPullService } from './sync-pull.service';
import { SyncPushService } from './sync-push.service';

/** Офлайн-синк мобилки: локальная база на телефоне сливается с сервером. */
@ApiTags('sync')
@Controller('sync')
@SportAuth()
export class SyncController {
  constructor(
    private readonly pullService: SyncPullService,
    private readonly pushService: SyncPushService,
    private readonly catalogService: SyncCatalogService,
  ) {}

  @Post('push')
  @Swagger({
    title: 'Применить операции из офлайн-очереди телефона',
    body: SyncPushDto,
    response: SyncPushResponseDto,
    bearerAuth: true,
  })
  public async push(
    @CurrentUser('id') userId: number,
    @Body() dto: SyncPushDto,
  ): Promise<SyncPushResponseDto> {
    return { results: await this.pushService.push(userId, dto.ops) };
  }

  @Get('pull')
  @Swagger({
    title: 'Изменения данных пользователя с курсора; без курсора — снимок',
    query: SyncPullQueryDto,
    response: SyncPullResponseDto,
    bearerAuth: true,
  })
  public pull(
    @CurrentUser('id') userId: number,
    @Query() query: SyncPullQueryDto,
  ) {
    return this.pullService.pull(userId, query.since);
  }

  @Get('catalog')
  @Swagger({
    title: 'Справочник для офлайна: упражнения, растяжки, мышцы, суставы, теги',
    query: SyncPullQueryDto,
    response: SyncCatalogResponseDto,
    bearerAuth: true,
  })
  public catalog(
    @CurrentUser('id') userId: number,
    @Query() query: SyncPullQueryDto,
  ) {
    return this.catalogService.catalogOf(userId, query.since);
  }
}
