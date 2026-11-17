import { SUPPORT_LIMITS } from '@app/support-chat-core'
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

import { trimText } from './transforms'

export class UpdateSupportMessageDto {
  @ApiProperty({ maxLength: SUPPORT_LIMITS.textMaxLength })
  @Transform(trimText)
  @IsString()
  @IsNotEmpty({ message: 'Текст не может быть пустым' })
  @MaxLength(SUPPORT_LIMITS.textMaxLength)
  public text: string
}
