import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';
import { CleanupStagedUploadsInterceptor } from '@/upload/cleanup-staged-uploads.interceptor';
import { imageUploadInterceptorOptions } from '@/upload/upload.utils';

import { CatalogAppService } from './catalog-app.service';
import { CatalogExerciseResponseDto } from './dto/catalog-exercise.response.dto';
import { CatalogImageDto } from './dto/catalog-image.dto';
import { CatalogImageResponseDto } from './dto/catalog-image.response.dto';
import { CatalogListItemResponseDto } from './dto/catalog-list-item.response.dto';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { CatalogRefResponseDto } from './dto/catalog-ref.response.dto';
import { CatalogSimilarQueryDto } from './dto/catalog-similar-query.dto';
import { CatalogSimilarResponseDto } from './dto/catalog-similar.response.dto';
import { CatalogStretchResponseDto } from './dto/catalog-stretch.response.dto';
import { ComplaintCreatedResponseDto } from './dto/complaint-created.response.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { CreateExerciseProposalDto } from './dto/create-exercise-proposal.dto';
import { CreateStretchProposalDto } from './dto/create-stretch-proposal.dto';

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

  // ── Правки ───────────────────────────────────────────────────

  @Post('image')
  @UseInterceptors(
    CleanupStagedUploadsInterceptor,
    FileInterceptor('file', imageUploadInterceptorOptions()),
  )
  @ApiConsumes('multipart/form-data')
  @Swagger({
    title: 'Загрузить картинку к правке упражнения',
    body: CatalogImageDto,
    response: CatalogImageResponseDto,
    bearerAuth: true,
  })
  public image(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не передан');
    return this.catalogAppService.image(file);
  }

  @Post('proposal/exercise/create')
  @Swagger({
    title: 'Предложить правку упражнения — уходит на модерацию',
    body: CreateExerciseProposalDto,
    response: ComplaintCreatedResponseDto,
    bearerAuth: true,
  })
  public proposeExercise(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateExerciseProposalDto,
  ) {
    return this.catalogAppService.proposeExercise(userId, dto);
  }

  @Post('proposal/stretch/create')
  @Swagger({
    title: 'Предложить правку растяжки — уходит на модерацию',
    body: CreateStretchProposalDto,
    response: ComplaintCreatedResponseDto,
    bearerAuth: true,
  })
  public proposeStretch(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateStretchProposalDto,
  ) {
    return this.catalogAppService.proposeStretch(userId, dto);
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
