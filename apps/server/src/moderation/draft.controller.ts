import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { PaginationQueryDto } from '@/common/type/pagination-query.dto';
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { DraftAppService } from './draft-app.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { DraftLimitResponseDto } from './dto/draft-limit.response.dto';
import { MyEntryResponseDto } from './dto/my-entry.response.dto';

@ApiTags('drafts')
@Controller('drafts')
@SportAuth()
export class DraftController {
  constructor(private readonly draftAppService: DraftAppService) {}

  @Get('limit')
  @Swagger({
    title: 'Сколько заявок ещё можно отправить сегодня',
    response: DraftLimitResponseDto,
    bearerAuth: true,
  })
  public limit(@CurrentUser('id') userId: number) {
    return this.draftAppService.limit(userId);
  }

  @Get('mine')
  @Swagger({
    title: 'Мои записи со статусами модерации',
    query: PaginationQueryDto,
    response: MyEntryResponseDto,
    isArray: true,
    bearerAuth: true,
  })
  public mine(
    @CurrentUser('id') userId: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.draftAppService.mine(userId, query);
  }

  @Post('create')
  @Swagger({
    title: 'Своё упражнение или растяжка: черновик и заявка на проверку',
    body: CreateDraftDto,
    response: MyEntryResponseDto,
    bearerAuth: true,
  })
  public create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateDraftDto,
  ) {
    return this.draftAppService.create(userId, dto);
  }
}
