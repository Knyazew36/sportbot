import { Module } from '@nestjs/common';

import { MiniappController } from './miniapp.controller';
import { MiniappService } from './miniapp.service';

@Module({
  controllers: [MiniappController],
  providers: [MiniappService],
})
export class MiniappModule {}
