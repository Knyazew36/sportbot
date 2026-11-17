import type { SupportCursorMeta } from '@app/support-chat-core'
import { ApiProperty } from '@nestjs/swagger'

export class SupportCursorMetaDto implements SupportCursorMeta {
  @ApiProperty({ description: 'Есть ещё сообщения в направлении запроса' })
  public hasMore: boolean
}
