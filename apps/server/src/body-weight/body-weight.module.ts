import { Module } from '@nestjs/common';

import { BodyWeightBot } from './body-weight.bot';
import { BodyWeightController } from './body-weight.controller';
import { BodyWeightService } from './body-weight.service';

@Module({
  controllers: [BodyWeightController],
  providers: [BodyWeightService, BodyWeightBot],
  exports: [BodyWeightService],
})
export class BodyWeightModule {}
