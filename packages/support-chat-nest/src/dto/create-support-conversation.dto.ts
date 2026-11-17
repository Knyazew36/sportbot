import { SUPPORT_LIMITS } from '@app/support-chat-core'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'

import { trimText } from './transforms'

/** Оператор пишет клиенту первым. */
export class CreateSupportConversationDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  public contactId: number

  @ApiPropertyOptional({ maxLength: SUPPORT_LIMITS.textMaxLength, description: 'Первое сообщение' })
  @Transform(trimText)
  @IsOptional()
  @IsString()
  @MaxLength(SUPPORT_LIMITS.textMaxLength)
  public text?: string
}
