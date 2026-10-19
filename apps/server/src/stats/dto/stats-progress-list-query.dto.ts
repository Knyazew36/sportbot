import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { StatsPeriodQueryDto } from './stats-period-query.dto';

export class StatsProgressListQueryDto extends StatsPeriodQueryDto {
  @ApiPropertyOptional({ description: 'Мышца — среди основных' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  filter_muscle?: number;

  @ApiPropertyOptional({
    enum: ['growing', 'stalled'],
    description: 'growing — выросли за период, stalled — стоят 3 недели',
  })
  @IsOptional()
  @IsIn(['growing', 'stalled'])
  filter_status?: 'growing' | 'stalled';

  @ApiPropertyOptional({ description: 'Поиск по названию' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'Сколько первых упражнений вернуть' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
