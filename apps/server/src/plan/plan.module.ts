import { Module } from '@nestjs/common';

import { PlanDayService } from './plan-day.service';

/** Нижний слой плана: дни и серия. Опросы и крон — PlanPollModule (ему нужны тренировки). */
@Module({
  providers: [PlanDayService],
  exports: [PlanDayService],
})
export class PlanModule {}
