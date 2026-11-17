import { SUPPORT_LIMITS } from '@app/support-chat-core'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator'

import { trimText } from './transforms'

/** Сообщение посетителя. Диалог выбирает сервер: текущий незакрытый или новый. Вложения — поле files. */
export class CreateSupportMessageDto {
  @ApiPropertyOptional({ maxLength: SUPPORT_LIMITS.textMaxLength, description: 'Пусто можно только с вложениями' })
  @Transform(trimText)
  @IsOptional()
  @IsString()
  @MaxLength(SUPPORT_LIMITS.textMaxLength)
  public text?: string

  @ApiPropertyOptional({ description: 'Ключ идемпотентности: один на сообщение, не меняется при повторах' })
  @IsOptional()
  @IsUUID()
  public clientMessageId?: string

  @ApiPropertyOptional({ description: 'id сообщения этого диалога, на которое отвечаем' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  public replyToId?: number
}
