import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { StatsUserQueryDto } from './stats-user-query.dto';

export class StatsRecordsQueryDto extends StatsUserQueryDto {
  @ApiPropertyOptional({
    description: 'Сколько последних рекордов; без параметра — все',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @ApiPropertyOptional({
    minimum: 7,
    maximum: 400,
    description: 'Только рекорды за последние N дней; без параметра — за всё время',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(400)
  days?: number;
}
