import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { BotMaxModule } from '../bot-max/bot-max.module';
import { UploadModule } from '../upload/upload.module';

import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [
    UploadModule,
    BotMaxModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
