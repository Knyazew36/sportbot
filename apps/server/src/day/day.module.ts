import { Module } from '@nestjs/common';

import { LimitationModule } from '@/limitation/limitation.module';
import { PlanPollModule } from '@/plan/plan-poll.module';
import { PlanModule } from '@/plan/plan.module';
import { ProgramModule } from '@/program/program.module';
import { WorkoutModule } from '@/workout/workout.module';

import { DayController } from './day.controller';
import { DayService } from './day.service';

/** Экран «Сегодня» Mini App: поверх дней плана, опросов и тренировок. */
@Module({
  imports: [
    PlanModule,
    PlanPollModule,
    ProgramModule,
    WorkoutModule,
    LimitationModule,
  ],
  controllers: [DayController],
  providers: [DayService],
})
export class DayModule {}
