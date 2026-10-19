import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { StatsUserQueryDto } from './stats-user-query.dto';

export class StatsPeriodQueryDto extends StatsUserQueryDto {
  @ApiPropertyOptional({
    default: 92,
    minimum: 7,
    maximum: 400,
    description: 'Период в днях, считая сегодня',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(400)
  days?: number;
}
