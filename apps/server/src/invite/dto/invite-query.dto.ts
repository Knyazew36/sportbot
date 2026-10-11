import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, Min } from 'class-validator'

import { PaginationQueryDto } from '@/common/type'

export class InviteQueryDto extends PaginationQueryDto {
  @ApiProperty({ description: 'ID кружка (обязательный фильтр)', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizationId: number
}
