import { SUPPORT_CONVERSATION_STATUSES, SUPPORT_LIMITS, type SupportConversationStatus } from '@app/support-chat-core'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, ValidateIf } from 'class-validator'

export class UpdateSupportConversationDto {
  @ApiPropertyOptional({ enum: SUPPORT_CONVERSATION_STATUSES })
  @IsOptional()
  @IsIn(SUPPORT_CONVERSATION_STATUSES)
  public status?: SupportConversationStatus

  @ApiPropertyOptional({ type: Number, nullable: true, description: 'id оператора; null — снять исполнителя' })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @Min(1)
  public assigneeId?: number | null

  @ApiPropertyOptional({ type: [String] })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? [...new Set(value.map(tag => (typeof tag === 'string' ? tag.trim() : tag)).filter(Boolean))]
      : value,
  )
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(SUPPORT_LIMITS.tagsMax)
  @IsString({ each: true })
  @MaxLength(SUPPORT_LIMITS.tagMaxLength, { each: true })
  public tags?: string[]
}
