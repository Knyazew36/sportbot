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
import { ProgramTagGroupResponseDto } from '@/program-tag/dto/program-tag-group.response.dto';
import { ProgramTagGroupService } from '@/program-tag/program-tag-group.service';

import { AddComplexExercisesDto } from './dto/add-complex-exercises.dto';
import { CreateComplexDto } from './dto/create-complex.dto';
import { CreateProgramDto } from './dto/create-program.dto';
import { ProgramListItemResponseDto } from './dto/program-list-item.response.dto';
import { ProgramResponseDto } from './dto/program.response.dto';
import { ReorderDto } from './dto/reorder.dto';
import { TemplatesQueryDto } from './dto/templates-query.dto';
import { UpdateComplexExerciseDto } from './dto/update-complex-exercise.dto';
import { UpdateComplexDto } from './dto/update-complex.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramAppService } from './program-app.service';

const ID_PARAM = { name: 'id', type: Number };

@ApiTags('program')
@Controller('program')
@SportAuth()
export class ProgramController {
  constructor(
    private readonly programAppService: ProgramAppService,
    private readonly programTagGroupService: ProgramTagGroupService,
  ) {}

  // ── Шаблоны ─────────────────────────────────────────────────────────────

  @Get('templates')
  @Swagger({
    title:
      'Каталог: опубликованные шаблоны с составом, фильтр по тегам и поиск',
    query: TemplatesQueryDto,
    response: ProgramResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public templates(
    @CurrentUser('id') userId: number,
    @Query() query: TemplatesQueryDto,
  ) {
    return this.programAppService.catalog(userId, query);
  }

  @Get('tag-groups')
  @Swagger({
    title: 'Ряды чипов каталога: группы с тегами опубликованных шаблонов',
    response: ProgramTagGroupResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public tagGroups() {
    return this.programTagGroupService.catalog();
  }

  @Post('take/:id')
  @Swagger({
    title: '«Взять» шаблон: копия в программы пользователя',
    param: { ...ID_PARAM, description: 'Шаблон' },
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public take(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.programAppService.take(userId, id);
  }

  // ── Программы ───────────────────────────────────────────────────────────

  @Get('list')
  @Swagger({
    title: 'Программы пользователя',
    response: ProgramListItemResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public list(@CurrentUser('id') userId: number) {
    return this.programAppService.list(userId);
  }

  @Post('create')
  @Swagger({
    title: 'Новая программа с нуля',
    body: CreateProgramDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateProgramDto,
  ) {
    return this.programAppService.create(userId, dto.name);
  }

  @Post('update/:id')
  @Swagger({
    title: 'Переименовать программу',
    param: ID_PARAM,
    body: UpdateProgramDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProgramDto,
  ) {
    return this.programAppService.update(userId, id, dto);
  }

  @Post('delete/:id')
  @Swagger({
    title: 'Удалить программу (история тренировок остаётся)',
    param: ID_PARAM,
    bearerAuth: true,
  })
  public remove(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.programAppService.remove(userId, id);
  }

  @Post('activate/:id')
  @Swagger({
    title: 'Сделать программу активной',
    param: ID_PARAM,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public activate(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.programAppService.activate(userId, id);
  }

  @Post('resync/:id')
  @Swagger({
    title: 'Обновить копию программы друга его версией',
    param: ID_PARAM,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public resync(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.programAppService.resync(userId, id);
  }

  @Post('dismiss-update/:id')
  @Swagger({
    title:
      '«Не сейчас»: спрятать плашку обновления до следующей правки источника',
    param: ID_PARAM,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public dismissUpdate(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.programAppService.dismissUpdate(userId, id);
  }

  // ── Комплексы ───────────────────────────────────────────────────────────

  @Post(':id/complex/create')
  @Swagger({
    title: 'Добавить комплекс в программу',
    param: ID_PARAM,
    body: CreateComplexDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public addComplex(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateComplexDto,
  ) {
    return this.programAppService.addComplex(userId, id, dto.name);
  }

  @Post(':id/complex/reorder')
  @Swagger({
    title: 'Порядок комплексов (очередь)',
    param: ID_PARAM,
    body: ReorderDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public reorderComplexes(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReorderDto,
  ) {
    return this.programAppService.reorderComplexes(userId, id, dto.ids);
  }

  @Post('complex/update/:id')
  @Swagger({
    title: 'Комплекс: название и кардио',
    param: ID_PARAM,
    body: UpdateComplexDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public updateComplex(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComplexDto,
  ) {
    return this.programAppService.updateComplex(userId, id, dto);
  }

  @Post('complex/delete/:id')
  @Swagger({
    title: 'Удалить комплекс',
    param: ID_PARAM,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public removeComplex(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.programAppService.removeComplex(userId, id);
  }

  // ── Упражнения комплекса ────────────────────────────────────────────────

  @Post('complex/:id/exercise/create')
  @Swagger({
    title: 'Добавить упражнения в комплекс',
    param: ID_PARAM,
    body: AddComplexExercisesDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public addExercises(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddComplexExercisesDto,
  ) {
    return this.programAppService.addExercises(userId, id, dto.exerciseIds);
  }

  @Post('complex/:id/exercise/reorder')
  @Swagger({
    title: 'Порядок упражнений в комплексе',
    param: ID_PARAM,
    body: ReorderDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public reorderItems(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReorderDto,
  ) {
    return this.programAppService.reorderItems(userId, id, dto.ids);
  }

  @Post('exercise/update/:id')
  @Swagger({
    title: 'План упражнения: подходы и повторы',
    param: ID_PARAM,
    body: UpdateComplexExerciseDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public updateItem(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComplexExerciseDto,
  ) {
    return this.programAppService.updateItem(userId, id, dto);
  }

  @Post('exercise/delete/:id')
  @Swagger({
    title: 'Убрать упражнение из комплекса',
    param: ID_PARAM,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public removeItem(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.programAppService.removeItem(userId, id);
  }

  // ── По id ───────────────────────────────────────────────────────────────

  @Get(':id')
  @Swagger({
    title: 'Программа с комплексами и упражнениями',
    param: ID_PARAM,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public view(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.programAppService.view(userId, id);
  }
}
