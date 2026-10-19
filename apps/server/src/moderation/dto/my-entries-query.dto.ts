import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { PaginationQueryDto } from '@/common/type/pagination-query.dto';

export class MyEntriesQueryDto extends PaginationQueryDto {
  @ApiProperty({ enum: ['exercise', 'stretch'], description: 'Вид записей' })
  @IsIn(['exercise', 'stretch'])
  filter_kind: 'exercise' | 'stretch';
}
