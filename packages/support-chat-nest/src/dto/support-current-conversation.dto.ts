import { ApiProperty } from '@nestjs/swagger'

import { SupportConversationDto } from './support-conversation.dto'

export class SupportCurrentConversationDto {
  @ApiProperty({ type: SupportConversationDto, nullable: true, description: 'null — посетитель ещё не писал' })
  public conversation: SupportConversationDto | null
}
