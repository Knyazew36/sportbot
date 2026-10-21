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
import { BotChannel, User } from '@/generated/prisma/client';
import { AuthChannel } from '@/miniapp/decorators/auth-channel.decorator';
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { AddWorkoutItemsDto } from './dto/add-workout-items.dto';
import { ClientAtDto } from './dto/client-at.dto';
import { ExcludeCooldownStretchDto } from './dto/exclude-cooldown-stretch.dto';
import { CooldownResponseDto } from './dto/cooldown.response.dto';
import { CreateWorkoutSetDto } from './dto/create-workout-set.dto';
import { FinishWorkoutDto } from './dto/finish-workout.dto';
import { ReplaceWorkoutItemDto } from './dto/replace-workout-item.dto';
import { SharedWorkoutResponseDto } from './dto/shared-workout.response.dto';
import { StartWorkoutDto } from './dto/start-workout.dto';
import { UpdateWorkoutSetDto } from './dto/update-workout-set.dto';
import { WorkoutAnalogResponseDto } from './dto/workout-analog.response.dto';
import { WorkoutCurrentResponseDto } from './dto/workout-current.response.dto';
import { WorkoutSummaryResponseDto } from './dto/workout-summary.response.dto';
import { WorkoutResponseDto } from './dto/workout.response.dto';
import { WorkoutAppService } from './workout-app.service';
import { WorkoutShareService } from './workout-share.service';

const ID_PARAM = { name: 'id', type: Number };

@ApiTags('workout')
@Controller('workout')
@SportAuth()
export class WorkoutController {
  constructor(
    private readonly workoutAppService: WorkoutAppService,
    private readonly workoutShareService: WorkoutShareService,
  ) {}

  // ── Тренировка ──────────────────────────────────────────────────────────

  @Get('current')
  @Swagger({
    title: 'Незавершённая тренировка (начатая в боте или приложении)',
    response: WorkoutCurrentResponseDto,
    bearerAuth: true,
  })
  public current(@CurrentUser('id') userId: number) {
    return this.workoutAppService.current(userId);
  }

  @Post('start')
  @Swagger({
    title: 'Начать тренировку: выбранный комплекс или комплекс дня',
    body: StartWorkoutDto,
    response: WorkoutResponseDto,
    bearerAuth: true,
  })
  public start(
    @CurrentUser('id') userId: number,
    @Body() dto: StartWorkoutDto,
  ) {
    return this.workoutAppService.start(userId, dto.complexId);
  }

  @Post('finish/:id')
  @Swagger({
    title: 'Завершить тренировку — итог; повтор возвращает тот же итог',
    param: ID_PARAM,
    body: FinishWorkoutDto,
    response: WorkoutSummaryResponseDto,
    bearerAuth: true,
  })
  public finish(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FinishWorkoutDto,
  ) {
    return this.workoutAppService.finish(
      userId,
      id,
      dto.finishedAt ? new Date(dto.finishedAt) : undefined,
    );
  }

  @Post('discard/:id')
  @Swagger({
    title: 'Отменить незавершённую тренировку',
    param: ID_PARAM,
    bearerAuth: true,
  })
  public discard(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workoutAppService.discard(userId, id);
  }

  @Post('delete/:id')
  @Swagger({
    title: 'Удалить закрытую тренировку из истории',
    param: ID_PARAM,
    bearerAuth: true,
  })
  public remove(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workoutAppService.remove(userId, id);
  }

  // ── Подходы ─────────────────────────────────────────────────────────────

  @Post('set/create')
  @Swagger({
    title: 'Записать подход',
    body: CreateWorkoutSetDto,
    response: WorkoutResponseDto,
    bearerAuth: true,
  })
  public addSet(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateWorkoutSetDto,
  ) {
    return this.workoutAppService.addSet(userId, dto);
  }

  @Post('set/update/:id')
  @Swagger({
    title: 'Исправить подход',
    param: ID_PARAM,
    body: UpdateWorkoutSetDto,
    response: WorkoutResponseDto,
    bearerAuth: true,
  })
  public updateSet(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkoutSetDto,
  ) {
    return this.workoutAppService.updateSet(
      userId,
      id,
      dto.weight ?? 0,
      dto.reps,
    );
  }

  @Post('set/delete/:id')
  @Swagger({
    title: 'Удалить подход',
    param: ID_PARAM,
    response: WorkoutResponseDto,
    bearerAuth: true,
  })
  public deleteSet(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workoutAppService.deleteSet(userId, id);
  }

  // ── Упражнения ──────────────────────────────────────────────────────────

  @Post('item/done/:id')
  @Swagger({
    title: '«Упражнение сделано»',
    param: ID_PARAM,
    response: WorkoutResponseDto,
    bearerAuth: true,
  })
  public markDone(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workoutAppService.markDone(userId, id);
  }

  @Get('item/:id/analogs')
  @Swagger({
    title: 'Аналоги для замены упражнения',
    param: ID_PARAM,
    response: WorkoutAnalogResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public analogs(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workoutAppService.analogs(userId, id);
  }

  @Post('item/replace/:id')
  @Swagger({
    title: 'Заменить упражнение: только сегодня или в комплексе',
    param: ID_PARAM,
    body: ReplaceWorkoutItemDto,
    response: WorkoutResponseDto,
    bearerAuth: true,
  })
  public replace(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplaceWorkoutItemDto,
  ) {
    return this.workoutAppService.replace(
      userId,
      id,
      dto.exerciseId,
      dto.inComplex,
    );
  }

  @Post('item/add/:id')
  @Swagger({
    title: 'Добавить упражнения в идущую тренировку',
    param: ID_PARAM,
    body: AddWorkoutItemsDto,
    response: WorkoutResponseDto,
    bearerAuth: true,
  })
  public addItems(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddWorkoutItemsDto,
  ) {
    return this.workoutAppService.addItems(
      userId,
      id,
      dto.exerciseIds,
      dto.inComplex,
    );
  }

  // ── Разминка ────────────────────────────────────────────────────────────

  @Post('warmup/finish/:id')
  @Swagger({
    title: 'Разминка закончена или пропущена: пишется один раз',
    param: ID_PARAM,
    body: ClientAtDto,
    bearerAuth: true,
  })
  public warmupFinish(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ClientAtDto,
  ) {
    return this.workoutAppService.warmupFinish(
      userId,
      id,
      dto.at ? new Date(dto.at) : undefined,
    );
  }

  // ── Заминка ─────────────────────────────────────────────────────────────

  @Post('cooldown/start/:id')
  @Swagger({
    title: 'Заминка начата: пишется первое открытие, повтор ничего не меняет',
    param: ID_PARAM,
    body: ClientAtDto,
    bearerAuth: true,
  })
  public cooldownStart(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ClientAtDto,
  ) {
    return this.workoutAppService.cooldownStart(
      userId,
      id,
      dto.at ? new Date(dto.at) : undefined,
    );
  }

  @Post('cooldown/finish/:id')
  @Swagger({
    title: 'Заминка пройдена: только после начала и один раз',
    param: ID_PARAM,
    body: ClientAtDto,
    bearerAuth: true,
  })
  public cooldownFinish(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ClientAtDto,
  ) {
    return this.workoutAppService.cooldownFinish(
      userId,
      id,
      dto.at ? new Date(dto.at) : undefined,
    );
  }

  @Post('cooldown/exclude/:id')
  @Swagger({
    title:
      'Не предлагать растяжку: исключить навсегда и заменить в этой заминке',
    param: ID_PARAM,
    body: ExcludeCooldownStretchDto,
    response: CooldownResponseDto,
    bearerAuth: true,
  })
  public cooldownExclude(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ExcludeCooldownStretchDto,
  ) {
    return this.workoutAppService.cooldownExclude(userId, id, dto.stretchId);
  }

  // ── Поделиться ──────────────────────────────────────────────────────────

  @Post('share/:id')
  @Swagger({
    title: 'Поделиться: бот присылает в чат карточку результата для пересылки',
    param: ID_PARAM,
    bearerAuth: true,
  })
  public share(
    @CurrentUser() user: User,
    @AuthChannel() channel: BotChannel | null,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workoutShareService.sendCard(user, id, channel);
  }

  @Get('shared/:token')
  @Swagger({
    title: 'Результат тренировки по ссылке «Поделиться»',
    param: { name: 'token', type: String },
    response: SharedWorkoutResponseDto,
    bearerAuth: true,
  })
  public shared(
    @CurrentUser('id') userId: number,
    @Param('token') token: string,
  ) {
    return this.workoutShareService.byToken(userId, token);
  }

  // ── По id ───────────────────────────────────────────────────────────────

  @Get(':id/summary')
  @Swagger({
    title: 'Итог тренировки',
    param: ID_PARAM,
    response: WorkoutSummaryResponseDto,
    bearerAuth: true,
  })
  public summary(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workoutAppService.summary(userId, id);
  }

  @Get(':id/cooldown')
  @Swagger({
    title: 'Заминка тренировки',
    param: ID_PARAM,
    response: CooldownResponseDto,
    bearerAuth: true,
  })
  public cooldown(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workoutAppService.cooldown(userId, id);
  }

  @Get(':id')
  @Swagger({
    title: 'Тренировка',
    param: ID_PARAM,
    response: WorkoutResponseDto,
    bearerAuth: true,
  })
  public find(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workoutAppService.find(userId, id);
  }
}
