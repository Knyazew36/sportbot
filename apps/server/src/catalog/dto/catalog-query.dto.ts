import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '@/common/type/pagination-query.dto';

/** «1,2» или повтор параметра → [1, 2]; нечисловое отсеет IsInt. */
const toIds = ({ value }: { value: unknown }): unknown =>
  (Array.isArray(value) ? value : String(value).split(','))
    .filter((v) => v !== '')
    .map(Number);

export class CatalogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    type: String,
    example: '12,13',
    description:
      'Id мышц через запятую: подходит запись с любой из них (у упражнений — среди основных)',
  })
  @IsOptional()
  @Transform(toIds)
  @IsArray()
  @IsInt({ each: true })
  filter_muscle?: number[];

  @ApiPropertyOptional({
    enum: ['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT'],
    description: 'Инвентарь — только упражнения',
  })
  @IsOptional()
  @IsIn(['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT'])
  filter_equipment?: 'BARBELL' | 'DUMBBELL' | 'MACHINE' | 'BODYWEIGHT';
}
