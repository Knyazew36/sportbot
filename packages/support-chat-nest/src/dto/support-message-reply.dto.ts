import { SUPPORT_MESSAGE_AUTHORS, type SupportMessageAuthor, type SupportMessageReply } from '@app/support-chat-core'
import { ApiProperty } from '@nestjs/swagger'

export class SupportMessageReplyDto implements SupportMessageReply {
  @ApiProperty()
  public id: number

  @ApiProperty({ description: 'По нему клиент догружает историю до оригинала' })
  public seq: number

  @ApiProperty({ enum: SUPPORT_MESSAGE_AUTHORS })
  public author: SupportMessageAuthor

  @ApiProperty({ type: String, nullable: true })
  public authorName: string | null

  @ApiProperty({ description: 'Начало текста; у удалённого — пустая строка' })
  public text: string

  @ApiProperty()
  public attachmentsCount: number

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  public deletedAt: string | null
}
