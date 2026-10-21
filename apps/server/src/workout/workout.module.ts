import { Module } from '@nestjs/common';

import { LimitationModule } from '@/limitation/limitation.module';
import { PlanModule } from '@/plan/plan.module';
import { ProgramModule } from '@/program/program.module';
import { StatsModule } from '@/stats/stats.module';
import { StretchExclusionModule } from '@/stretch-exclusion/stretch-exclusion.module';
import { UploadModule } from '@/upload/upload.module';

import { CooldownService } from './cooldown.service';
import { WorkoutAppService } from './workout-app.service';
import { WorkoutFlow } from './workout-flow.service';
import { WorkoutShareService } from './workout-share.service';
import { WorkoutBot } from './workout.bot';
import { WorkoutController } from './workout.controller';
import { WorkoutService } from './workout.service';

@Module({
  imports: [
    ProgramModule,
    PlanModule,
    LimitationModule,
    UploadModule,
    StatsModule,
    StretchExclusionModule,
  ],
  controllers: [WorkoutController],
  providers: [
    WorkoutService,
    WorkoutAppService,
    CooldownService,
    WorkoutFlow,
    WorkoutShareService,
    WorkoutBot,
  ],
  exports: [WorkoutService, WorkoutFlow],
})
export class WorkoutModule {}
