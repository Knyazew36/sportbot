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

import { DayService } from './day.service';
import { DayComplexDto } from './dto/day-complex.dto';
import { DayEveningDto } from './dto/day-evening.dto';
import { DayEveningResponseDto } from './dto/day-evening.response.dto';
import { DayFixDto } from './dto/day-fix.dto';
import { DayFixResponseDto } from './dto/day-fix.response.dto';
import { DayRescheduleDto } from './dto/day-reschedule.dto';
import { DaySkipResponseDto } from './dto/day-skip.response.dto';
import { DayTodayResponseDto } from './dto/day-today.response.dto';

@ApiTags('day')
@Controller('day')
@SportAuth()
export class DayController {
  constructor(private readonly dayService: DayService) {}

  @Get('today')
  @Swagger({
    title: 'Сегодня: состояние дня, серия, неделя, комплекс дня',
    response: DayTodayResponseDto,
    bearerAuth: true,
  })
  public today(@CurrentUser('id') userId: number) {
    return this.dayService.today(userId);
  }

  @Post('complex')
  @Swagger({
    title: '«Другая тренировка»: выбрать комплекс на сегодня вместо очереди',
    body: DayComplexDto,
    bearerAuth: true,
  })
  public pickComplex(
    @CurrentUser('id') userId: number,
    @Body() dto: DayComplexDto,
  ) {
    return this.dayService.pickComplex(userId, dto.complexId);
  }

  @Post('skip')
  @Swagger({
    title: '«Сегодня не буду»: пропуск дня, как утреннее «нет» в боте',
    response: DaySkipResponseDto,
    bearerAuth: true,
  })
  public skip(@CurrentUser('id') userId: number) {
    return this.dayService.skip(userId);
  }

  @Post('evening')
  @Swagger({
    title: 'Вечерний ответ «потренировался сегодня?»',
    body: DayEveningDto,
    response: DayEveningResponseDto,
    bearerAuth: true,
  })
  public evening(
    @CurrentUser('id') userId: number,
    @Body() dto: DayEveningDto,
  ) {
    return this.dayService.evening(userId, dto.yes);
  }

  @Post('reschedule')
  @Swagger({
    title: 'Ответ на «напомнить завтра?» после пропуска',
    body: DayRescheduleDto,
    bearerAuth: true,
  })
  public reschedule(
    @CurrentUser('id') userId: number,
    @Body() dto: DayRescheduleDto,
  ) {
    return this.dayService.reschedule(userId, dto.accept);
  }

  @Post('fix/:id')
  @Swagger({
    title: 'Исправить отметку дня (в пределах 7 дней)',
    param: { name: 'id', type: Number, description: 'День плана' },
    body: DayFixDto,
    response: DayFixResponseDto,
    bearerAuth: true,
  })
  public fix(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DayFixDto,
  ) {
    return this.dayService.fix(userId, id, dto.status);
  }
}
