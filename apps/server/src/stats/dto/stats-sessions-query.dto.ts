import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '@/common/type/pagination-query.dto';

export class StatsSessionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Статистика друга; без параметра — своя',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;
}
