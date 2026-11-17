import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { Request } from 'express'

import { SupportApi } from '../decorators/support-api.decorator'
import { VisitContactId } from '../decorators/support-params.decorator'
import {
  CreateSupportMessageDto,
  CreateSupportSessionDto,
  ListSupportMessagesQueryDto,
  MarkSupportReadDto,
  RateSupportConversationDto,
  SupportConversationDto,
  SupportCurrentConversationDto,
  SupportMessageDto,
  SupportSessionDto,
  UpdateSupportMessageDto,
} from '../dto'
import { SupportVisitGuard } from '../guards/support-visit.guard'
import { SupportFilesInterceptor } from '../interceptors/support-files.interceptor'
import { SupportVisitorService } from '../services/support-visitor.service'

/**
 * Посетитель (виджет). session — публичный, остальное — по токену визита (SupportVisitGuard).
 * Посетитель видит только свои диалоги: принадлежность проверяется в where каждого запроса.
 */
@ApiTags('support')
@Controller('support')
export class SupportVisitorController {
  constructor(private readonly visitor: SupportVisitorService) {}

  @Post('session')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @SupportApi({ title: 'Войти в чат поддержки: токен визита для API и сокета', response: SupportSessionDto })
  public startSession(@Body() dto: CreateSupportSessionDto, @Req() request: Request) {
    return this.visitor.startSession(dto, request)
  }

  @Get('conversation/current')
  @UseGuards(SupportVisitGuard)
  @SupportApi({ title: 'Текущий незакрытый диалог посетителя', response: SupportCurrentConversationDto, auth: 'visit' })
  public currentConversation(@VisitContactId() contactId: number) {
    return this.visitor.currentConversation(contactId)
  }

  @Post('conversation/read')
  @UseGuards(SupportVisitGuard)
  @SupportApi({ title: 'Отметить прочитанным до seq', response: SupportConversationDto, auth: 'visit' })
  public markRead(@VisitContactId() contactId: number, @Body() dto: MarkSupportReadDto) {
    return this.visitor.markRead(contactId, dto)
  }

  @Post('conversation/rate')
  @UseGuards(SupportVisitGuard)
  @SupportApi({ title: 'Оценить работу поддержки', response: SupportConversationDto, auth: 'visit' })
  public rate(@VisitContactId() contactId: number, @Body() dto: RateSupportConversationDto) {
    return this.visitor.rate(contactId, dto)
  }

  @Get('message/list')
  @UseGuards(SupportVisitGuard)
  @SupportApi({
    title: 'История диалога: листание вверх по beforeSeq, добор после обрыва по afterSeq',
    response: SupportMessageDto,
    list: 'cursor',
    auth: 'visit',
  })
  public history(@VisitContactId() contactId: number, @Query() query: ListSupportMessagesQueryDto) {
    return this.visitor.history(contactId, query)
  }

  @Post('message/create')
  @UseGuards(SupportVisitGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @UseInterceptors(SupportFilesInterceptor)
  @SupportApi({
    title: 'Написать в поддержку (текст и/или файлы); повтор с тем же clientMessageId не создаёт дубль',
    response: SupportMessageDto,
    auth: 'visit',
    multipart: CreateSupportMessageDto,
  })
  public createMessage(
    @VisitContactId() contactId: number,
    @Body() dto: CreateSupportMessageDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    return this.visitor.createMessage(contactId, dto, files)
  }

  @Post('message/update/:id')
  @UseGuards(SupportVisitGuard)
  @SupportApi({ title: 'Изменить своё сообщение (в течение 15 минут)', response: SupportMessageDto, auth: 'visit' })
  public updateMessage(
    @VisitContactId() contactId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupportMessageDto,
  ) {
    return this.visitor.updateMessage(contactId, id, dto)
  }

  @Post('message/delete/:id')
  @UseGuards(SupportVisitGuard)
  @SupportApi({ title: 'Удалить своё сообщение (в течение 15 минут)', response: SupportMessageDto, auth: 'visit' })
  public deleteMessage(@VisitContactId() contactId: number, @Param('id', ParseIntPipe) id: number) {
    return this.visitor.deleteMessage(contactId, id)
  }
}
