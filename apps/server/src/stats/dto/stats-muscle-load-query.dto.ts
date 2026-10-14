import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { StatsUserQueryDto } from './stats-user-query.dto';

export class StatsMuscleLoadQueryDto extends StatsUserQueryDto {
  @ApiPropertyOptional({
    default: 0,
    description: 'Неделя: 0 — текущая, 1 — прошлая и т. д.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(52)
  weeksAgo?: number;
}
