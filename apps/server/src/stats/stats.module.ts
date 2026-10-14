import { Module } from '@nestjs/common';

import { StatsAppService } from './stats-app.service';
import { StatsBot } from './stats.bot';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  controllers: [StatsController],
  providers: [StatsService, StatsAppService, StatsBot],
  exports: [StatsService, StatsBot],
})
export class StatsModule {}
