import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { Swagger } from '@/common/decorators/swagger/swagger.decorator';

import { imageUploadInterceptorOptions } from '../upload/upload.utils';

import { ChatService } from './chat.service';
import { ChatSubmissionDto } from './dto/chat-submission.dto';
import { CreateChatSubmissionDto } from './dto/create-chat-submission.dto';

const MAX_ATTACHMENTS = 5;

// Публичный эндпоинт (без MultiAuthGuard) — форма чата на сайте, защищена троттлингом.
// Чтение/удаление сообщений — только платформенному админу, см. AdminChatSubmissionController.
@ApiTags('chat-submission')
@UseGuards(ThrottlerGuard)
@Controller('chat-submission')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(
    FilesInterceptor('files', MAX_ATTACHMENTS, imageUploadInterceptorOptions()),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
      required: ['message'],
    },
  })
  @Swagger({
    title: 'Отправить сообщение из чата (телефон/email + до 5 картинок)',
    response: ChatSubmissionDto,
  })
  create(
    @Body() dto: CreateChatSubmissionDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    return this.chatService.create(dto, files);
  }
}
