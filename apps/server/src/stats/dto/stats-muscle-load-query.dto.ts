import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { StatsUserQueryDto } from './stats-user-query.dto';

export class StatsMuscleLoadQueryDto extends StatsUserQueryDto {
  @ApiPropertyOptional({
    default: 4,
    description: 'За сколько последних недель считать среднее',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(53)
  weeks?: number;
}
