import {
  SUPPORT_CHANNELS,
  SUPPORT_CONVERSATION_STATUSES,
  type SupportChannel,
  type SupportConversationStatus,
} from '@app/support-chat-core'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator'

import { toBoolean, trimToUndefined } from './transforms'

export class ListSupportConversationsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  public page?: number

  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  public limit?: number

  @ApiPropertyOptional({ description: 'Поиск по имени, email, телефону контакта' })
  @Transform(trimToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  public search?: string

  @ApiPropertyOptional({
    type: String,
    description: `Статусы через запятую: ${SUPPORT_CONVERSATION_STATUSES.join(', ')}`,
    example: 'OPEN,PENDING',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map(item => item.trim()) : value))
  @IsOptional()
  @IsIn(SUPPORT_CONVERSATION_STATUSES, { each: true, message: 'Неизвестный статус обращения' })
  public filter_status?: SupportConversationStatus[]

  @ApiPropertyOptional({ description: 'me — мои, none — без исполнителя, число — id оператора', example: 'me' })
  @IsOptional()
  @Matches(/^(me|none|\d+)$/, { message: 'filter_assignee: me, none или id оператора' })
  public filter_assignee?: string

  @ApiPropertyOptional({ enum: SUPPORT_CHANNELS })
  @IsOptional()
  @IsIn(SUPPORT_CHANNELS)
  public filter_channel?: SupportChannel

  @ApiPropertyOptional({ default: false, description: 'Добавить контакт' })
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  public add_contact?: boolean

  @ApiPropertyOptional({ default: false, description: 'Добавить последнее сообщение' })
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  public add_last_message?: boolean
}
