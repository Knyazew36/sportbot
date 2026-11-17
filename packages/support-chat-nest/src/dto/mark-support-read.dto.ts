import { ApiProperty } from '@nestjs/swagger'
import { IsInt, Min } from 'class-validator'

export class MarkSupportReadDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  public conversationId: number

  @ApiProperty({ description: 'Прочитано до этого seq включительно' })
  @IsInt()
  @Min(0)
  public seq: number
}
