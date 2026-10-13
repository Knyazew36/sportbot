import { Module } from '@nestjs/common';

import { LimitationModule } from '@/limitation/limitation.module';
import { PlanModule } from '@/plan/plan.module';
import { ProgramModule } from '@/program/program.module';

import { CooldownService } from './cooldown.service';
import { WorkoutFlow } from './workout-flow.service';
import { WorkoutBot } from './workout.bot';
import { WorkoutService } from './workout.service';

@Module({
  imports: [ProgramModule, PlanModule, LimitationModule],
  providers: [WorkoutService, CooldownService, WorkoutFlow, WorkoutBot],
  exports: [WorkoutService, WorkoutFlow],
})
export class WorkoutModule {}
