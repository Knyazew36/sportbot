import { Module } from '@nestjs/common';

import { StatsBot } from './stats.bot';
import { StatsService } from './stats.service';

@Module({
  providers: [StatsService, StatsBot],
  exports: [StatsService, StatsBot],
})
export class StatsModule {}
