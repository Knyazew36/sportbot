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
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { CatalogAppService } from './catalog-app.service';
import { CatalogExerciseResponseDto } from './dto/catalog-exercise.response.dto';
import { CatalogListItemResponseDto } from './dto/catalog-list-item.response.dto';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { CatalogRefResponseDto } from './dto/catalog-ref.response.dto';
import { CatalogSimilarQueryDto } from './dto/catalog-similar-query.dto';
import { CatalogSimilarResponseDto } from './dto/catalog-similar.response.dto';
import { CatalogStretchResponseDto } from './dto/catalog-stretch.response.dto';
import { ComplaintCreatedResponseDto } from './dto/complaint-created.response.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';

const ID_PARAM = { name: 'id', type: Number };

@ApiTags('catalog')
@Controller('catalog')
@SportAuth()
export class CatalogController {
  constructor(private readonly catalogAppService: CatalogAppService) {}

  // ── Справочники ─────────────────────────────────────────────────────────

  @Get('muscles')
  @Swagger({
    title: 'Мышцы',
    response: CatalogRefResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public muscles() {
    return this.catalogAppService.muscles();
  }

  @Get('joints')
  @Swagger({
    title: 'Суставы (зоны ограничений)',
    response: CatalogRefResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public joints() {
    return this.catalogAppService.joints();
  }

  @Get('similar')
  @Swagger({
    title: '«Возможно, ты искал…» по введённому названию',
    query: CatalogSimilarQueryDto,
    response: CatalogSimilarResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public similar(@Query() query: CatalogSimilarQueryDto) {
    return this.catalogAppService.similar(query.kind, query.name);
  }

  @Post('complaint/create')
  @Swagger({
    title: '«Ошибка в описании» — жалоба администратору',
    body: CreateComplaintDto,
    response: ComplaintCreatedResponseDto,
    bearerAuth: true,
  })
  public complain(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateComplaintDto,
  ) {
    return this.catalogAppService.complain(userId, dto);
  }

  // ── Упражнения ──────────────────────────────────────────────────────────

  @Get('exercises')
  @Swagger({
    title: 'Упражнения: поиск, мышца, инвентарь',
    query: CatalogQueryDto,
    response: CatalogListItemResponseDto,
    isArray: true,
    bearerAuth: true,
  })
  public exercises(
    @CurrentUser('id') userId: number,
    @Query() query: CatalogQueryDto,
  ) {
    return this.catalogAppService.exercises(userId, query);
  }

  @Get('exercises/:id')
  @Swagger({
    title: 'Карточка упражнения',
    param: ID_PARAM,
    response: CatalogExerciseResponseDto,
    bearerAuth: true,
  })
  public exercise(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.catalogAppService.exercise(userId, id);
  }

  // ── Растяжки ────────────────────────────────────────────────────────────

  @Get('stretches')
  @Swagger({
    title: 'Растяжки: поиск, мышца',
    query: CatalogQueryDto,
    response: CatalogListItemResponseDto,
    isArray: true,
    bearerAuth: true,
  })
  public stretches(
    @CurrentUser('id') userId: number,
    @Query() query: CatalogQueryDto,
  ) {
    return this.catalogAppService.stretches(userId, query);
  }

  @Get('stretches/:id')
  @Swagger({
    title: 'Карточка растяжки',
    param: ID_PARAM,
    response: CatalogStretchResponseDto,
    bearerAuth: true,
  })
  public stretch(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.catalogAppService.stretch(userId, id);
  }
}
