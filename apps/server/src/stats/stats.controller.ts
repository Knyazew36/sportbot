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
import { StatsMuscleLoadQueryDto } from './dto/stats-muscle-load-query.dto';
import { StatsMuscleLoadResponseDto } from './dto/stats-muscle-load.response.dto';
import { StatsPointResponseDto } from './dto/stats-point.response.dto';
import { StatsProgressItemResponseDto } from './dto/stats-progress-item.response.dto';
import { StatsProgressListQueryDto } from './dto/stats-progress-list-query.dto';
import { StatsProgressQueryDto } from './dto/stats-progress-query.dto';
import { StatsProgressResponseDto } from './dto/stats-progress.response.dto';
import { StatsRecordResponseDto } from './dto/stats-record.response.dto';
import { StatsRecordsQueryDto } from './dto/stats-records-query.dto';
import { StatsSessionResponseDto } from './dto/stats-session.response.dto';
import { StatsSessionsQueryDto } from './dto/stats-sessions-query.dto';
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
    title:
      'Прогресс по упражнениям за период: лучший подход, рост, «стоит» / «не делали»',
    query: StatsProgressListQueryDto,
    response: StatsProgressItemResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public progressList(
    @CurrentUser('id') userId: number,
    @Query() query: StatsProgressListQueryDto,
  ) {
    return this.statsAppService.progressList(userId, query);
  }

  @Get('progress/:id')
  @Swagger({
    title: 'Прогресс упражнения: лучший подход по тренировкам за период',
    param: { name: 'id', type: Number, description: 'Упражнение' },
    query: StatsProgressQueryDto,
    response: StatsProgressResponseDto,
    bearerAuth: true,
  })
  public progress(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: StatsProgressQueryDto,
  ) {
    return this.statsAppService.progress(userId, id, query);
  }

  @Get('progress/:id/sessions')
  @Swagger({
    title: 'История тренировок с упражнением: подходы, лучший, рекорд',
    param: { name: 'id', type: Number, description: 'Упражнение' },
    query: StatsSessionsQueryDto,
    response: StatsSessionResponseDto,
    isArray: true,
    bearerAuth: true,
  })
  public sessions(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: StatsSessionsQueryDto,
  ) {
    return this.statsAppService.sessions(userId, id, query);
  }

  @Get('records')
  @Swagger({
    title: 'Лента личных рекордов, новые сверху',
    query: StatsRecordsQueryDto,
    response: StatsRecordResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public records(
    @CurrentUser('id') userId: number,
    @Query() query: StatsRecordsQueryDto,
  ) {
    return this.statsAppService.records(userId, query);
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
    title: 'Баланс мышц: подходов в неделю в среднем за последние недели',
    query: StatsMuscleLoadQueryDto,
    response: StatsMuscleLoadResponseDto,
    plainArray: true,
    bearerAuth: true,
  })
  public muscleLoad(
    @CurrentUser('id') userId: number,
    @Query() query: StatsMuscleLoadQueryDto,
  ) {
    return this.statsAppService.muscleLoad(userId, query.userId, query.weeks);
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
