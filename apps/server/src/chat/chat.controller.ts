import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { MultiAuthGuard } from '@/common/guards/multi-auth.guard';
import { PlatformAdminGuard } from '@/common/guards/platform-admin.guard';
import { PaginationQueryDto } from '@/common/type';

import { CleanupStagedUploadsInterceptor } from '../upload/cleanup-staged-uploads.interceptor';
import { imageUploadInterceptorOptions } from '../upload/upload.utils';

import { ChatService } from './chat.service';
import { ChatSubmissionDto } from './dto/chat-submission.dto';
import { CreateChatSubmissionDto } from './dto/create-chat-submission.dto';

const MAX_ATTACHMENTS = 5;

// create — публичный эндпоинт (без MultiAuthGuard): форма обратной связи на сайте, защищена троттлингом
// (глобальный ThrottlerGuard + ужесточённый @Throttle).
// Чтение и удаление сообщений — только платформенному админу. Правки сообщений нет намеренно:
// это входящие обращения, их не редактируют.
@ApiTags('chat-submission')
@Controller('chat-submission')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('create')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(
    CleanupStagedUploadsInterceptor,
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

  @Get('list')
  @UseGuards(MultiAuthGuard, PlatformAdminGuard)
  @Swagger({
    title: 'Сообщения с сайта (платформенный админ)',
    query: PaginationQueryDto,
    response: ChatSubmissionDto,
    isArray: true,
    bearerAuth: true,
  })
  list(@Query() query: PaginationQueryDto) {
    return this.chatService.list(query);
  }

  @Get(':id')
  @UseGuards(MultiAuthGuard, PlatformAdminGuard)
  @Swagger({
    title: 'Сообщение с сайта по id (платформенный админ)',
    param: { name: 'id', type: Number },
    response: ChatSubmissionDto,
    bearerAuth: true,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.findOne(id);
  }

  @Post('delete/:id')
  @UseGuards(MultiAuthGuard, PlatformAdminGuard)
  @Swagger({
    title:
      'Удалить сообщение с сайта вместе с вложениями (платформенный админ)',
    param: { name: 'id', type: Number },
    response: ChatSubmissionDto,
    bearerAuth: true,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.remove(id);
  }
}
