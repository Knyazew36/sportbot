import { Module } from '@nestjs/common';

import { LimitationModule } from '@/limitation/limitation.module';
import { PlanPollModule } from '@/plan/plan-poll.module';
import { PlanModule } from '@/plan/plan.module';
import { ProgramModule } from '@/program/program.module';
import { SyncModule } from '@/sync/sync.module';
import { WorkoutModule } from '@/workout/workout.module';

import { DayController } from './day.controller';
import { DaySyncService } from './day-sync.service';
import { DayService } from './day.service';

/** Экран «Сегодня» Mini App: поверх дней плана, опросов и тренировок. */
@Module({
  imports: [
    PlanModule,
    PlanPollModule,
    ProgramModule,
    WorkoutModule,
    LimitationModule,
    SyncModule,
  ],
  controllers: [DayController],
  providers: [DayService, DaySyncService],
})
export class DayModule {}
