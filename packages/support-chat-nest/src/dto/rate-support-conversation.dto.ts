import { SUPPORT_LIMITS } from '@app/support-chat-core'
import { ApiProperty } from '@nestjs/swagger'
import { IsInt, Max, Min } from 'class-validator'

export class RateSupportConversationDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  public conversationId: number

  @ApiProperty({ minimum: SUPPORT_LIMITS.ratingMin, maximum: SUPPORT_LIMITS.ratingMax })
  @IsInt()
  @Min(SUPPORT_LIMITS.ratingMin)
  @Max(SUPPORT_LIMITS.ratingMax)
  public rating: number
}
