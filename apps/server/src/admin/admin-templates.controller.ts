import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { SportAdmin } from '@/miniapp/decorators/sport-auth.decorator';
import { AddComplexExercisesDto } from '@/program/dto/add-complex-exercises.dto';
import { CreateComplexDto } from '@/program/dto/create-complex.dto';
import { ProgramResponseDto } from '@/program/dto/program.response.dto';
import { ReorderDto } from '@/program/dto/reorder.dto';
import { UngroupSupersetDto } from '@/program/dto/ungroup-superset.dto';
import { UpdateComplexExerciseDto } from '@/program/dto/update-complex-exercise.dto';
import { UpdateComplexDto } from '@/program/dto/update-complex.dto';
import { ProgramAppService } from '@/program/program-app.service';
import { TEMPLATES } from '@/program/program.service';

import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

const ID_PARAM = { name: 'id', type: Number };

/** Шаблоны программ (frontend-tz, 14.2): тот же редактор, что у программы пользователя, плюс описание. */
@ApiTags('admin-templates')
@Controller('admin/templates')
@SportAdmin()
export class AdminTemplatesController {
  constructor(private readonly programAppService: ProgramAppService) {}

  @Get('list')
  @Swagger({
    title: 'Шаблоны',
    response: ProgramResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public list() {
    return this.programAppService.adminTemplates();
  }

  @Post('reorder')
  @Swagger({
    title: 'Порядок шаблонов в каталоге',
    body: ReorderDto,
    response: ProgramResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public reorder(@Body() dto: ReorderDto) {
    return this.programAppService.reorderTemplates(dto.ids);
  }

  @Post('from-program/:id')
  @Swagger({
    title: 'Скрытый шаблон из своей программы: оригинал остаётся',
    param: { ...ID_PARAM, description: 'Своя программа' },
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public fromProgram(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.programAppService.templateFromProgram(userId, id);
  }

  @Post('create')
  @Swagger({
    title: 'Новый шаблон',
    body: CreateTemplateDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public create(@Body() dto: CreateTemplateDto) {
    return this.programAppService.createTemplate(dto);
  }

  @Post('update/:id')
  @Swagger({
    title: 'Название, описание, теги и публикация шаблона',
    param: ID_PARAM,
    body: UpdateTemplateDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.programAppService.update(TEMPLATES, id, dto);
  }

  @Post('delete/:id')
  @Swagger({
    title: 'Удалить шаблон, который ещё никто не взял',
    param: ID_PARAM,
    bearerAuth: true,
  })
  public remove(@Param('id', ParseIntPipe) id: number) {
    return this.programAppService.removeTemplate(id);
  }

  // ── Комплексы ───────────────────────────────────────────────────────────

  @Post(':id/complex/create')
  @Swagger({
    title: 'Добавить комплекс в шаблон',
    param: ID_PARAM,
    body: CreateComplexDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public addComplex(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateComplexDto,
  ) {
    return this.programAppService.addComplex(TEMPLATES, id, dto.name);
  }

  @Post(':id/complex/reorder')
  @Swagger({
    title: 'Порядок комплексов шаблона',
    param: ID_PARAM,
    body: ReorderDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public reorderComplexes(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReorderDto,
  ) {
    return this.programAppService.reorderComplexes(TEMPLATES, id, dto.ids);
  }

  @Post('complex/update/:id')
  @Swagger({
    title: 'Комплекс шаблона: название и кардио',
    param: ID_PARAM,
    body: UpdateComplexDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public updateComplex(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComplexDto,
  ) {
    return this.programAppService.updateComplex(TEMPLATES, id, dto);
  }

  @Post('complex/delete/:id')
  @Swagger({
    title: 'Удалить комплекс шаблона',
    param: ID_PARAM,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public removeComplex(@Param('id', ParseIntPipe) id: number) {
    return this.programAppService.removeComplex(TEMPLATES, id);
  }

  // ── Упражнения ──────────────────────────────────────────────────────────

  @Post('complex/:id/exercise/create')
  @Swagger({
    title: 'Добавить упражнения в комплекс шаблона',
    param: ID_PARAM,
    body: AddComplexExercisesDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public addExercises(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddComplexExercisesDto,
  ) {
    return this.programAppService.addExercises(TEMPLATES, id, dto);
  }

  @Post('complex/:id/superset/ungroup')
  @Swagger({
    title: 'Разгруппировать суперсет комплекса шаблона',
    param: ID_PARAM,
    body: UngroupSupersetDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public ungroupSuperset(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UngroupSupersetDto,
  ) {
    return this.programAppService.ungroupSuperset(
      TEMPLATES,
      id,
      dto.superset,
    );
  }

  @Post('exercise/ungroup/:id')
  @Swagger({
    title: 'Вынести упражнение шаблона из суперсета',
    param: ID_PARAM,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public ungroupItem(@Param('id', ParseIntPipe) id: number) {
    return this.programAppService.ungroupItem(TEMPLATES, id);
  }

  @Post('complex/:id/exercise/reorder')
  @Swagger({
    title: 'Порядок упражнений комплекса шаблона',
    param: ID_PARAM,
    body: ReorderDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public reorderItems(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReorderDto,
  ) {
    return this.programAppService.reorderItems(TEMPLATES, id, dto.ids);
  }

  @Post('exercise/update/:id')
  @Swagger({
    title: 'План упражнения шаблона',
    param: ID_PARAM,
    body: UpdateComplexExerciseDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComplexExerciseDto,
  ) {
    return this.programAppService.updateItem(TEMPLATES, id, dto);
  }

  @Post('exercise/delete/:id')
  @Swagger({
    title: 'Убрать упражнение из комплекса шаблона',
    param: ID_PARAM,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public removeItem(@Param('id', ParseIntPipe) id: number) {
    return this.programAppService.removeItem(TEMPLATES, id);
  }

  @Get(':id')
  @Swagger({
    title: 'Шаблон с комплексами',
    param: ID_PARAM,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public view(@Param('id', ParseIntPipe) id: number) {
    return this.programAppService.view(TEMPLATES, id);
  }
}
