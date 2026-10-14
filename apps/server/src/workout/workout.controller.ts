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
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { CooldownResponseDto } from './dto/cooldown.response.dto';
import { CreateWorkoutSetDto } from './dto/create-workout-set.dto';
import { ReplaceWorkoutItemDto } from './dto/replace-workout-item.dto';
import { StartWorkoutDto } from './dto/start-workout.dto';
import { UpdateWorkoutSetDto } from './dto/update-workout-set.dto';
import { WorkoutAnalogResponseDto } from './dto/workout-analog.response.dto';
import { WorkoutCurrentResponseDto } from './dto/workout-current.response.dto';
import { WorkoutSummaryResponseDto } from './dto/workout-summary.response.dto';
import { WorkoutResponseDto } from './dto/workout.response.dto';
import { WorkoutAppService } from './workout-app.service';

const ID_PARAM = { name: 'id', type: Number };

@ApiTags('workout')
@Controller('workout')
@SportAuth()
export class WorkoutController {
  constructor(private readonly workoutAppService: WorkoutAppService) {}

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
    title: 'Завершить тренировку — итог',
    param: ID_PARAM,
    response: WorkoutSummaryResponseDto,
    bearerAuth: true,
  })
  public finish(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workoutAppService.finish(userId, id);
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
