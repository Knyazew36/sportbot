import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '@/common/type/pagination-query.dto';

export class AdminComplaintsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ['OPEN', 'RESOLVED', 'REJECTED'],
    default: 'OPEN',
  })
  @IsOptional()
  @IsIn(['OPEN', 'RESOLVED', 'REJECTED'])
  filter_status?: 'OPEN' | 'RESOLVED' | 'REJECTED';
}
