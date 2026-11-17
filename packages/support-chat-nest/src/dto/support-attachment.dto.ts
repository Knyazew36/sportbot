import type { SupportAttachment } from '@app/support-chat-core'
import { ApiProperty } from '@nestjs/swagger'

export class SupportAttachmentDto implements SupportAttachment {
  @ApiProperty()
  public id: number

  @ApiProperty({ description: 'Публичная ссылка на файл' })
  public url: string

  @ApiProperty()
  public name: string

  @ApiProperty({ example: 'image/png' })
  public mime: string

  @ApiProperty({ description: 'Размер в байтах' })
  public size: number
}
