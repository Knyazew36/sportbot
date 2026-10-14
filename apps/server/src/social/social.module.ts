import { Module } from '@nestjs/common';

import { PlanModule } from '@/plan/plan.module';
import { ProgramModule } from '@/program/program.module';
import { StatsModule } from '@/stats/stats.module';

import { SocialAppService } from './social-app.service';
import { SocialBot } from './social.bot';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

/** Друзья и обмен программой. Групповые чаты отложены (раздел 29 ТЗ). */
@Module({
  imports: [ProgramModule, StatsModule, PlanModule],
  controllers: [SocialController],
  providers: [SocialService, SocialAppService, SocialBot],
})
export class SocialModule {}
