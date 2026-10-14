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

import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { SportAdmin } from '@/miniapp/decorators/sport-auth.decorator';
import { CleanupStagedUploadsInterceptor } from '@/upload/cleanup-staged-uploads.interceptor';
import { imageUploadInterceptorOptions } from '@/upload/upload.utils';

import { AdminCatalogService } from './admin-catalog.service';
import { AdminCatalogItemResponseDto } from './dto/admin-catalog-item.response.dto';
import { AdminCatalogQueryDto } from './dto/admin-catalog-query.dto';
import { AdminExerciseResponseDto } from './dto/admin-exercise.response.dto';
import { AdminStretchResponseDto } from './dto/admin-stretch.response.dto';
import { CatalogImageDto } from './dto/catalog-image.dto';
import { CatalogImageResponseDto } from './dto/catalog-image.response.dto';
import { SaveExerciseDto } from './dto/save-exercise.dto';
import { SaveStretchDto } from './dto/save-stretch.dto';

const ID_PARAM = { name: 'id', type: Number };

@ApiTags('admin-catalog')
@Controller('admin/catalog')
@SportAdmin()
export class AdminCatalogController {
  constructor(private readonly adminCatalogService: AdminCatalogService) {}

  @Post('image')
  @UseInterceptors(
    CleanupStagedUploadsInterceptor,
    FileInterceptor('file', imageUploadInterceptorOptions()),
  )
  @ApiConsumes('multipart/form-data')
  @Swagger({
    title: 'Загрузить картинку записи справочника',
    body: CatalogImageDto,
    response: CatalogImageResponseDto,
    bearerAuth: true,
  })
  public image(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не передан');
    return this.adminCatalogService.image(file);
  }

  // ── Упражнения ──────────────────────────────────────────────────────────

  @Get('exercises')
  @Swagger({
    title: 'Упражнения: поиск, без картинки, без мышц',
    query: AdminCatalogQueryDto,
    response: AdminCatalogItemResponseDto,
    isArray: true,
    bearerAuth: true,
  })
  public exercises(@Query() query: AdminCatalogQueryDto) {
    return this.adminCatalogService.exercises(query);
  }

  @Post('exercises/create')
  @Swagger({
    title: 'Создать упражнение',
    body: SaveExerciseDto,
    response: AdminExerciseResponseDto,
    bearerAuth: true,
  })
  public createExercise(@Body() dto: SaveExerciseDto) {
    return this.adminCatalogService.createExercise(dto);
  }

  @Post('exercises/update/:id')
  @Swagger({
    title: 'Изменить упражнение',
    param: ID_PARAM,
    body: SaveExerciseDto,
    response: AdminExerciseResponseDto,
    bearerAuth: true,
  })
  public updateExercise(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveExerciseDto,
  ) {
    return this.adminCatalogService.updateExercise(id, dto);
  }

  @Post('exercises/delete/:id')
  @Swagger({ title: 'Удалить упражнение', param: ID_PARAM, bearerAuth: true })
  public removeExercise(@Param('id', ParseIntPipe) id: number) {
    return this.adminCatalogService.removeExercise(id);
  }

  @Get('exercises/:id')
  @Swagger({
    title: 'Упражнение для формы',
    param: ID_PARAM,
    response: AdminExerciseResponseDto,
    bearerAuth: true,
  })
  public exercise(@Param('id', ParseIntPipe) id: number) {
    return this.adminCatalogService.exercise(id);
  }

  // ── Растяжки ────────────────────────────────────────────────────────────

  @Get('stretches')
  @Swagger({
    title: 'Растяжки: поиск, без картинки, без мышц',
    query: AdminCatalogQueryDto,
    response: AdminCatalogItemResponseDto,
    isArray: true,
    bearerAuth: true,
  })
  public stretches(@Query() query: AdminCatalogQueryDto) {
    return this.adminCatalogService.stretches(query);
  }

  @Post('stretches/create')
  @Swagger({
    title: 'Создать растяжку',
    body: SaveStretchDto,
    response: AdminStretchResponseDto,
    bearerAuth: true,
  })
  public createStretch(@Body() dto: SaveStretchDto) {
    return this.adminCatalogService.createStretch(dto);
  }

  @Post('stretches/update/:id')
  @Swagger({
    title: 'Изменить растяжку',
    param: ID_PARAM,
    body: SaveStretchDto,
    response: AdminStretchResponseDto,
    bearerAuth: true,
  })
  public updateStretch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveStretchDto,
  ) {
    return this.adminCatalogService.updateStretch(id, dto);
  }

  @Post('stretches/delete/:id')
  @Swagger({ title: 'Удалить растяжку', param: ID_PARAM, bearerAuth: true })
  public removeStretch(@Param('id', ParseIntPipe) id: number) {
    return this.adminCatalogService.removeStretch(id);
  }

  @Get('stretches/:id')
  @Swagger({
    title: 'Растяжка для формы',
    param: ID_PARAM,
    response: AdminStretchResponseDto,
    bearerAuth: true,
  })
  public stretch(@Param('id', ParseIntPipe) id: number) {
    return this.adminCatalogService.stretch(id);
  }
}
