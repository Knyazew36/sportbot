import {
  SUPPORT_CHANNELS,
  SUPPORT_CONVERSATION_STATUSES,
  type SupportChannel,
  type SupportConversation,
  type SupportConversationStatus,
} from '@app/support-chat-core'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

import { SupportContactDto } from './support-contact.dto'
import { SupportMessageDto } from './support-message.dto'

export class SupportConversationDto implements SupportConversation {
  @ApiProperty()
  public id: number

  @ApiProperty({ enum: SUPPORT_CONVERSATION_STATUSES })
  public status: SupportConversationStatus

  @ApiProperty()
  public contactId: number

  @ApiProperty({ type: Number, nullable: true })
  public assigneeId: number | null

  @ApiProperty({ type: String, nullable: true })
  public assigneeName: string | null

  @ApiProperty({ enum: SUPPORT_CHANNELS })
  public sourceChannel: SupportChannel

  @ApiProperty({ description: 'seq последнего сообщения' })
  public lastSeq: number

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  public lastMessageAt: string | null

  @ApiProperty()
  public contactReadSeq: number

  @ApiProperty()
  public operatorReadSeq: number

  @ApiProperty()
  public unreadForContact: number

  @ApiProperty({ description: 'Клиенту всегда 0' })
  public unreadForOperator: number

  @ApiProperty({ type: [String], description: 'Клиенту всегда пустой' })
  public tags: string[]

  @ApiProperty({ type: Number, nullable: true })
  public rating: number | null

  @ApiProperty({ format: 'date-time' })
  public createdAt: string

  @ApiProperty({ format: 'date-time' })
  public updatedAt: string

  @ApiPropertyOptional({ type: SupportContactDto, description: 'Только у оператора, по add_contact' })
  public contact?: SupportContactDto

  @ApiPropertyOptional({ type: SupportMessageDto, nullable: true, description: 'По add_last_message' })
  public lastMessage?: SupportMessageDto | null
}
