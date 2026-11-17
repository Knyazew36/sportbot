import {
  SUPPORT_CHANNELS,
  SUPPORT_MESSAGE_AUTHORS,
  type SupportChannel,
  type SupportMessage,
  type SupportMessageAuthor,
} from '@app/support-chat-core'
import { ApiProperty } from '@nestjs/swagger'

import { SupportAttachmentDto } from './support-attachment.dto'
import { SupportMessageReplyDto } from './support-message-reply.dto'

export class SupportMessageDto implements SupportMessage {
  @ApiProperty()
  public id: number

  @ApiProperty()
  public conversationId: number

  @ApiProperty({ description: 'Порядок внутри диалога, по нему клиент находит пропуски' })
  public seq: number

  @ApiProperty({ enum: SUPPORT_MESSAGE_AUTHORS })
  public author: SupportMessageAuthor

  @ApiProperty({ type: Number, nullable: true })
  public authorId: number | null

  @ApiProperty({ type: String, nullable: true })
  public authorName: string | null

  @ApiProperty({ description: 'У удалённого сообщения — пустая строка' })
  public text: string

  @ApiProperty({ description: 'Заметка операторов — клиенту не приходит' })
  public isInternalNote: boolean

  @ApiProperty({ type: String, nullable: true })
  public clientMessageId: string | null

  @ApiProperty({ enum: SUPPORT_CHANNELS })
  public channel: SupportChannel

  @ApiProperty({ type: [SupportAttachmentDto] })
  public attachments: SupportAttachmentDto[]

  @ApiProperty({ type: SupportMessageReplyDto, nullable: true, description: 'На какое сообщение ответ' })
  public replyTo: SupportMessageReplyDto | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  public editedAt: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  public deletedAt: string | null

  @ApiProperty({ format: 'date-time' })
  public createdAt: string
}
