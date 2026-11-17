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
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { SupportApi } from '../decorators/support-api.decorator'
import { CurrentSupportOperator } from '../decorators/support-params.decorator'
import {
  CreateSupportConversationDto,
  CreateSupportOperatorMessageDto,
  ListSupportConversationsQueryDto,
  ListSupportMessagesQueryDto,
  MarkSupportReadDto,
  SupportConversationDto,
  SupportMessageDto,
  UpdateSupportConversationDto,
  UpdateSupportMessageDto,
} from '../dto'
import { SupportHostAuthGuard } from '../guards/support-host-auth.guard'
import { SupportOperatorGuard } from '../guards/support-operator.guard'
import { SupportFilesInterceptor } from '../interceptors/support-files.interceptor'
import type { SupportOperator } from '../ports'
import { SupportOperatorService } from '../services/support-operator.service'

/** Операторы: авторизация проекта (authGuard) + решение проекта, оператор ли пользователь (SupportIdentity). */
@ApiTags('support-operator')
@Controller('support/operator')
@UseGuards(SupportHostAuthGuard, SupportOperatorGuard)
export class SupportOperatorController {
  constructor(private readonly operators: SupportOperatorService) {}

  // ── Диалоги ────────────────────────────────────────────────────────────────

  @Post('conversation/create')
  @SupportApi({ title: 'Написать клиенту первым', response: SupportConversationDto, auth: 'operator' })
  public createConversation(
    @CurrentSupportOperator() operator: SupportOperator,
    @Body() dto: CreateSupportConversationDto,
  ) {
    return this.operators.createConversation(operator, dto)
  }

  @Get('conversation/list')
  @SupportApi({
    title: 'Инбокс: диалоги с фильтрами по статусу, исполнителю, каналу',
    response: SupportConversationDto,
    list: 'page',
    auth: 'operator',
  })
  public listConversations(
    @CurrentSupportOperator() operator: SupportOperator,
    @Query() query: ListSupportConversationsQueryDto,
  ) {
    return this.operators.listConversations(operator, query)
  }

  @Post('conversation/read')
  @SupportApi({ title: 'Отметить диалог прочитанным до seq', response: SupportConversationDto, auth: 'operator' })
  public markRead(@CurrentSupportOperator() operator: SupportOperator, @Body() dto: MarkSupportReadDto) {
    return this.operators.markRead(operator, dto)
  }

  @Get('conversation/:id')
  @SupportApi({ title: 'Диалог с контактом', response: SupportConversationDto, auth: 'operator' })
  public getConversation(@Param('id', ParseIntPipe) id: number) {
    return this.operators.getConversation(id)
  }

  @Post('conversation/update/:id')
  @SupportApi({ title: 'Изменить статус, исполнителя, теги', response: SupportConversationDto, auth: 'operator' })
  public updateConversation(
    @CurrentSupportOperator() operator: SupportOperator,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupportConversationDto,
  ) {
    return this.operators.updateConversation(operator, id, dto)
  }

  @Post('conversation/delete/:id')
  @SupportApi({
    title: 'Удалить диалог вместе с сообщениями и файлами',
    response: SupportConversationDto,
    auth: 'operator',
  })
  public deleteConversation(
    @CurrentSupportOperator() operator: SupportOperator,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.operators.deleteConversation(operator, id)
  }

  @Post('conversation/assign/:id')
  @SupportApi({ title: 'Взять диалог себе', response: SupportConversationDto, auth: 'operator' })
  public assign(@CurrentSupportOperator() operator: SupportOperator, @Param('id', ParseIntPipe) id: number) {
    return this.operators.assign(operator, id)
  }

  @Post('conversation/close/:id')
  @SupportApi({ title: 'Закрыть обращение', response: SupportConversationDto, auth: 'operator' })
  public close(@CurrentSupportOperator() operator: SupportOperator, @Param('id', ParseIntPipe) id: number) {
    return this.operators.close(operator, id)
  }

  @Post('conversation/reopen/:id')
  @SupportApi({ title: 'Открыть обращение снова', response: SupportConversationDto, auth: 'operator' })
  public reopen(@CurrentSupportOperator() operator: SupportOperator, @Param('id', ParseIntPipe) id: number) {
    return this.operators.reopen(operator, id)
  }

  // ── Сообщения ──────────────────────────────────────────────────────────────

  @Post('message/create')
  @UseInterceptors(SupportFilesInterceptor)
  @SupportApi({
    title: 'Ответить клиенту или оставить заметку; повтор с тем же clientMessageId не создаёт дубль',
    response: SupportMessageDto,
    auth: 'operator',
    multipart: CreateSupportOperatorMessageDto,
  })
  public createMessage(
    @CurrentSupportOperator() operator: SupportOperator,
    @Body() dto: CreateSupportOperatorMessageDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    return this.operators.createMessage(operator, dto, files)
  }

  @Get('message/list')
  @SupportApi({
    title: 'История диалога с заметками: вверх по beforeSeq, добор по afterSeq',
    response: SupportMessageDto,
    list: 'cursor',
    auth: 'operator',
  })
  public history(@Query() query: ListSupportMessagesQueryDto) {
    return this.operators.history(query)
  }

  @Get('message/:id')
  @SupportApi({ title: 'Сообщение по id', response: SupportMessageDto, auth: 'operator' })
  public getMessage(@Param('id', ParseIntPipe) id: number) {
    return this.operators.getMessage(id)
  }

  @Post('message/update/:id')
  @SupportApi({ title: 'Изменить своё сообщение', response: SupportMessageDto, auth: 'operator' })
  public updateMessage(
    @CurrentSupportOperator() operator: SupportOperator,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupportMessageDto,
  ) {
    return this.operators.updateMessage(operator, id, dto)
  }

  @Post('message/delete/:id')
  @SupportApi({
    title: 'Удалить сообщение (любое — в том числе спам клиента)',
    response: SupportMessageDto,
    auth: 'operator',
  })
  public deleteMessage(@CurrentSupportOperator() operator: SupportOperator, @Param('id', ParseIntPipe) id: number) {
    return this.operators.deleteMessage(operator, id)
  }
}
