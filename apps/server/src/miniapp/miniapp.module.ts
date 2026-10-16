import { Module } from '@nestjs/common';

import { AvatarModule } from '@/avatar/avatar.module';

import { MiniappController } from './miniapp.controller';
import { MiniappService } from './miniapp.service';

@Module({
  imports: [AvatarModule],
  controllers: [MiniappController],
  providers: [MiniappService],
})
export class MiniappModule {}
