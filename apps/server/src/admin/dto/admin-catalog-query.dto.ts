import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';

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

  @ApiPropertyOptional({
    enum: ['CATALOG', 'DRAFT'],
    description: 'CATALOG — опубликованные, DRAFT — личные и снятые',
  })
  @IsOptional()
  @IsIn(['CATALOG', 'DRAFT'])
  filter_status?: 'CATALOG' | 'DRAFT';

  @ApiPropertyOptional({ description: 'Только созданные пользователями' })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  filter_userMade?: boolean;
}
