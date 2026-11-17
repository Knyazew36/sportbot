import type { SupportContact } from '@app/support-chat-core'
import { ApiProperty } from '@nestjs/swagger'

export class SupportContactDto implements SupportContact {
  @ApiProperty()
  public id: number

  @ApiProperty({ type: String, nullable: true, description: 'id пользователя проекта; null — аноним' })
  public externalUserId: string | null

  @ApiProperty({ type: String, nullable: true })
  public name: string | null

  @ApiProperty({ type: String, nullable: true })
  public email: string | null

  @ApiProperty({ type: String, nullable: true })
  public phone: string | null

  @ApiProperty({ format: 'date-time' })
  public createdAt: string
}
