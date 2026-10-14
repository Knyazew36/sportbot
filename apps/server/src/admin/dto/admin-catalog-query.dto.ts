import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '@/common/type/pagination-query.dto';

const toBool = ({ value }: { value: unknown }) =>
  value === true || value === 'true';

export class AdminCatalogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Только без картинки' })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  filter_noImage?: boolean;

  @ApiPropertyOptional({ description: 'Только без мышц' })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  filter_noMuscles?: boolean;
}
