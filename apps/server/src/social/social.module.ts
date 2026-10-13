import { Module } from '@nestjs/common';

import { PlanModule } from '@/plan/plan.module';
import { ProgramModule } from '@/program/program.module';
import { StatsModule } from '@/stats/stats.module';

import { SocialBot } from './social.bot';
import { SocialService } from './social.service';

/** Друзья и обмен программой. Групповые чаты отложены (раздел 29 ТЗ). */
@Module({
  imports: [ProgramModule, StatsModule, PlanModule],
  providers: [SocialService, SocialBot],
})
export class SocialModule {}
