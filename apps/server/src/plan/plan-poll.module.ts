import { Module } from '@nestjs/common';

import { BodyWeightModule } from '@/body-weight/body-weight.module';
import { PauseModule } from '@/pause/pause.module';
import { ProgramModule } from '@/program/program.module';
import { StatsModule } from '@/stats/stats.module';
import { WorkoutModule } from '@/workout/workout.module';

import { PlanCronService } from './plan-cron.service';
import { PlanBot } from './plan.bot';
import { PlanModule } from './plan.module';
import { PollService } from './poll.service';

/**
 * Опросы и крон. Отдельно от PlanModule: им нужны тренировки, а тренировкам — дни плана;
 * общий модуль дал бы циклическую зависимость.
 */
@Module({
  imports: [
    PlanModule,
    WorkoutModule,
    ProgramModule,
    PauseModule,
    BodyWeightModule,
    StatsModule,
  ],
  providers: [PollService, PlanBot, PlanCronService],
  exports: [PollService],
})
export class PlanPollModule {}
