import { Module } from '@nestjs/common';

import { BodyWeightBot } from './body-weight.bot';
import { BodyWeightService } from './body-weight.service';

@Module({
  providers: [BodyWeightService, BodyWeightBot],
  exports: [BodyWeightService],
})
export class BodyWeightModule {}
