import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { StatsAttendanceQueryDto } from './dto/stats-attendance-query.dto';
import { StatsAttendanceWeekResponseDto } from './dto/stats-attendance-week.response.dto';
import { StatsBodyWeightQueryDto } from './dto/stats-body-weight-query.dto';
import { StatsCalendarDayResponseDto } from './dto/stats-calendar-day.response.dto';
import { StatsCalendarQueryDto } from './dto/stats-calendar-query.dto';
import { StatsDayQueryDto } from './dto/stats-day-query.dto';
import { StatsDayResponseDto } from './dto/stats-day.response.dto';
import { StatsExerciseResponseDto } from './dto/stats-exercise.response.dto';
import { StatsMuscleLoadQueryDto } from './dto/stats-muscle-load-query.dto';
import { StatsMuscleLoadResponseDto } from './dto/stats-muscle-load.response.dto';
import { StatsMuscleProgressResponseDto } from './dto/stats-muscle-progress.response.dto';
import { StatsPointResponseDto } from './dto/stats-point.response.dto';
import { StatsSummaryResponseDto } from './dto/stats-summary.response.dto';
import { StatsUserQueryDto } from './dto/stats-user-query.dto';
import { StatsAppService } from './stats-app.service';

@ApiTags('stats')
@Controller('stats')
@SportAuth()
export class StatsController {
  constructor(private readonly statsAppService: StatsAppService) {}

  @Get('summary')
  @Swagger({
    title: 'Сводка: посещаемость за неделю и месяц, серия',
    query: StatsUserQueryDto,
    response: StatsSummaryResponseDto,
    bearerAuth: true,
  })
  public summary(
    @CurrentUser('id') userId: number,
    @Query() query: StatsUserQueryDto,
  ) {
    return this.statsAppService.summary(userId, query.userId);
  }

  @Get('attendance')
  @Swagger({
    title: 'Посещаемость по неделям',
    query: StatsAttendanceQueryDto,
    response: StatsAttendanceWeekResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public attendance(
    @CurrentUser('id') userId: number,
    @Query() query: StatsAttendanceQueryDto,
  ) {
    return this.statsAppService.attendanceWeekly(
      userId,
      query.userId,
      query.weeks,
    );
  }

  @Get('progress/exercises')
  @Swagger({
    title: 'Упражнения, по которым есть прогресс весов',
    query: StatsUserQueryDto,
    response: StatsExerciseResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public progressExercises(
    @CurrentUser('id') userId: number,
    @Query() query: StatsUserQueryDto,
  ) {
    return this.statsAppService.progressExercises(userId, query.userId);
  }

  @Get('progress/:id')
  @Swagger({
    title: 'Прогресс весов по упражнению',
    param: { name: 'id', type: Number, description: 'Упражнение' },
    query: StatsUserQueryDto,
    response: StatsPointResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public progress(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: StatsUserQueryDto,
  ) {
    return this.statsAppService.progress(userId, query.userId, id);
  }

  @Get('body-weight')
  @Swagger({
    title: 'Вес тела по датам (только свой)',
    query: StatsBodyWeightQueryDto,
    response: StatsPointResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public bodyWeight(
    @CurrentUser('id') userId: number,
    @Query() query: StatsBodyWeightQueryDto,
  ) {
    return this.statsAppService.bodyWeight(userId, query.days);
  }

  @Get('muscle-load')
  @Swagger({
    title: 'Нагрузка по мышцам за неделю',
    query: StatsMuscleLoadQueryDto,
    response: StatsMuscleLoadResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public muscleLoad(
    @CurrentUser('id') userId: number,
    @Query() query: StatsMuscleLoadQueryDto,
  ) {
    return this.statsAppService.muscleLoad(
      userId,
      query.userId,
      query.weeksAgo,
    );
  }

  @Get('muscle/:id')
  @Swagger({
    title: 'Прогресс весов по мышце: упражнения, где она основная',
    param: { name: 'id', type: Number, description: 'Мышца' },
    query: StatsUserQueryDto,
    response: StatsMuscleProgressResponseDto,
    bearerAuth: true,
  })
  public muscleProgress(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: StatsUserQueryDto,
  ) {
    return this.statsAppService.muscleProgress(userId, query.userId, id);
  }

  @Get('calendar')
  @Swagger({
    title: 'Календарь месяца с отметками дней',
    query: StatsCalendarQueryDto,
    response: StatsCalendarDayResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public calendar(
    @CurrentUser('id') userId: number,
    @Query() query: StatsCalendarQueryDto,
  ) {
    return this.statsAppService.calendar(userId, query.userId, query.month);
  }

  @Get('day')
  @Swagger({
    title: 'Детали дня: комплекс, упражнения, подходы',
    query: StatsDayQueryDto,
    response: StatsDayResponseDto,
    bearerAuth: true,
  })
  public day(
    @CurrentUser('id') userId: number,
    @Query() query: StatsDayQueryDto,
  ) {
    return this.statsAppService.day(userId, query.userId, query.date);
  }
}
