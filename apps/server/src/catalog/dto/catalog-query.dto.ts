import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '@/common/type/pagination-query.dto';

export class CatalogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Мышца (у упражнений — среди основных)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  filter_muscle?: number;

  @ApiPropertyOptional({
    enum: ['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT'],
    description: 'Инвентарь — только упражнения',
  })
  @IsOptional()
  @IsIn(['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT'])
  filter_equipment?: 'BARBELL' | 'DUMBBELL' | 'MACHINE' | 'BODYWEIGHT';
}
