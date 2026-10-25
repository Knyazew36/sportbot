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
import { ProgramTagGroupResponseDto } from '@/program-tag/dto/program-tag-group.response.dto';
import { PublishProgramDto } from '@/program-publication/dto/publish-program.dto';
import { ProgramTagGroupService } from '@/program-tag/program-tag-group.service';

import { AddComplexExercisesDto } from './dto/add-complex-exercises.dto';
import { CopyComplexDto } from './dto/copy-complex.dto';
import { CreateComplexDto } from './dto/create-complex.dto';
import { CreateProgramDto } from './dto/create-program.dto';
import { ProgramListItemResponseDto } from './dto/program-list-item.response.dto';
import { ProgramShareLinkResponseDto } from './dto/program-share-link.response.dto';
import { ProgramResponseDto } from './dto/program.response.dto';
import { ReorderDto } from './dto/reorder.dto';
import { TagGroupsQueryDto } from './dto/tag-groups-query.dto';
import { TemplatesQueryDto } from './dto/templates-query.dto';
import { UngroupSupersetDto } from './dto/ungroup-superset.dto';
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
      'Каталог: опубликованные шаблоны или программы пользователей с составом, фильтр по тегам и поиск',
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
    title:
      'Ряды чипов: группы с тегами опубликованных шаблонов или все теги справочника',
    query: TagGroupsQueryDto,
    response: ProgramTagGroupResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public tagGroups(@Query() query: TagGroupsQueryDto) {
    return query.filter_all
      ? this.programTagGroupService.all()
      : this.programTagGroupService.catalog();
  }

  @Post('take/:id')
  @Swagger({
    title:
      '«Взять» из каталога: копия шаблона или чужой опубликованной программы',
    param: { ...ID_PARAM, description: 'Шаблон или программа каталога' },
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public take(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.programAppService.take(userId, id);
  }

  // ── Поделиться ──────────────────────────────────────────────────────────

  @Post('share/:id')
  @Swagger({
    title: 'Ссылка «Поделиться» на свою программу: по ней любой заберёт копию',
    param: ID_PARAM,
    response: ProgramShareLinkResponseDto,
    bearerAuth: true,
  })
  public share(
    @CurrentUser('id') userId: number,
    @AuthChannel() channel: BotChannel | null,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.programAppService.shareLink(userId, id, channel);
  }

  @Get('shared/:token')
  @Swagger({
    title: 'Программа по ссылке «Поделиться»: состав и автор',
    param: { name: 'token', type: String },
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public shared(
    @CurrentUser('id') userId: number,
    @Param('token') token: string,
  ) {
    return this.programAppService.shared(userId, token);
  }

  @Post('shared/take/:token')
  @Swagger({
    title: '«Забрать себе» программу по ссылке «Поделиться»',
    param: { name: 'token', type: String },
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public takeShared(
    @CurrentUser('id') userId: number,
    @Param('token') token: string,
  ) {
    return this.programAppService.takeShared(userId, token);
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

  @Post('publish/:id')
  @Swagger({
    title:
      'Опубликовать или изменить публикацию: описание и теги, проверка администратором',
    param: ID_PARAM,
    body: PublishProgramDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public publish(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PublishProgramDto,
  ) {
    return this.programAppService.publish(userId, id, dto);
  }

  @Post('unpublish/:id')
  @Swagger({
    title: 'Снять с публикации: копии у взявших остаются',
    param: ID_PARAM,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public unpublish(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.programAppService.unpublish(userId, id);
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

  @Post('complex/make-next/:id')
  @Swagger({
    title: 'Сделать комплекс активной программы следующим в очереди',
    param: ID_PARAM,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public makeNextComplex(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.programAppService.makeNext(userId, id);
  }

  @Post('complex/copy/:id')
  @Swagger({
    title:
      'Скопировать тренировку в конец своей программы (по умолчанию — активной)',
    param: ID_PARAM,
    body: CopyComplexDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public copyComplex(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CopyComplexDto,
  ) {
    return this.programAppService.copyComplex(
      userId,
      id,
      dto.shareToken,
      dto.programId,
    );
  }

  @Post('complex/update/:id')
  @Swagger({
    title: 'Комплекс: название',
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
    return this.programAppService.addExercises(userId, id, dto);
  }

  @Post('complex/:id/superset/ungroup')
  @Swagger({
    title: 'Разгруппировать суперсет комплекса',
    param: ID_PARAM,
    body: UngroupSupersetDto,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public ungroupSuperset(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UngroupSupersetDto,
  ) {
    return this.programAppService.ungroupSuperset(userId, id, dto.superset);
  }

  @Post('exercise/ungroup/:id')
  @Swagger({
    title: 'Вынести упражнение из суперсета',
    param: ID_PARAM,
    response: ProgramResponseDto,
    bearerAuth: true,
  })
  public ungroupItem(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.programAppService.ungroupItem(userId, id);
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
