import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class StatsBodyWeightQueryDto {
  @ApiPropertyOptional({
    default: 90,
    description: 'За сколько последних дней',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(730)
  days?: number;
}
