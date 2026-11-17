import { SUPPORT_LIMITS } from '@app/support-chat-core'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

export class ListSupportMessagesQueryDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public conversationId: number

  @ApiPropertyOptional({ description: 'Сообщения до этого seq — листание истории вверх' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  public beforeSeq?: number

  @ApiPropertyOptional({ description: 'Сообщения после этого seq — добор после обрыва связи' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  public afterSeq?: number

  @ApiPropertyOptional({ default: SUPPORT_LIMITS.historyPageSize, maximum: SUPPORT_LIMITS.historyPageMax })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(SUPPORT_LIMITS.historyPageMax)
  public limit?: number
}
