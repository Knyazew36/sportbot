import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '@/common/type/pagination-query.dto';

export const PROGRAM_REVIEW_FILTERS = ['queue', 'published'] as const;

export type ProgramReviewFilter = (typeof PROGRAM_REVIEW_FILTERS)[number];

export class ProgramReviewsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: PROGRAM_REVIEW_FILTERS,
    enumName: 'ProgramReviewFilter',
    default: 'queue',
    description: 'queue — ждут решения, published — уже в каталоге',
  })
  @IsOptional()
  @IsIn(PROGRAM_REVIEW_FILTERS)
  filter_status?: ProgramReviewFilter;
}
