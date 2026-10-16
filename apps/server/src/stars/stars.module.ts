import { Module } from '@nestjs/common';

import { StarsBot } from './stars.bot';
import { StarsController } from './stars.controller';
import { StarsService } from './stars.service';

/** Оплата звёздами Telegram. StarsService нужен и адаптеру Telegram — он передаёт ему события оплаты */
@Module({
  controllers: [StarsController],
  providers: [StarsService, StarsBot],
  exports: [StarsService],
})
export class StarsModule {}
