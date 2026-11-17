import type { SupportSession } from '@app/support-chat-core'
import { ApiProperty } from '@nestjs/swagger'

import { SupportContactDto } from './support-contact.dto'

export class SupportSessionDto implements SupportSession {
  @ApiProperty({ description: 'Токен визита: заголовок x-support-visit и auth.visitToken сокета' })
  public token: string

  @ApiProperty({ format: 'date-time' })
  public expiresAt: string

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Ключ анонимного посетителя — хранить и передавать при следующем входе',
  })
  public anonymousKey: string | null

  @ApiProperty({ type: SupportContactDto })
  public contact: SupportContactDto
}
