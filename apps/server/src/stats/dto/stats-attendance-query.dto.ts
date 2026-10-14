import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { StatsUserQueryDto } from './stats-user-query.dto';

export class StatsAttendanceQueryDto extends StatsUserQueryDto {
  @ApiPropertyOptional({ default: 12, description: 'Сколько последних недель' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(52)
  weeks?: number;
}
