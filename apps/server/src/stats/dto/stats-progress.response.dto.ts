import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { ProgressUnit } from '../stats.service';
import { StatsE1rmResponseDto } from './stats-e1rm.response.dto';
import { StatsProgressItemResponseDto } from './stats-progress-item.response.dto';
import { StatsProgressPointResponseDto } from './stats-progress-point.response.dto';

export class StatsProgressResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({
    enum: ['kg', 'reps', 'sec', 'min'],
    enumName: 'ProgressUnit',
  })
  unit: ProgressUnit;

  @ApiProperty({
    type: StatsProgressItemResponseDto,
    nullable: true,
    description: 'Шапка: лучший подход, рост, статус; null — подходов ещё нет',
  })
  summary: StatsProgressItemResponseDto | null;

  @ApiProperty({
    type: [StatsProgressPointResponseDto],
    description: 'Точки за период',
  })
  points: StatsProgressPointResponseDto[];

  @ApiPropertyOptional({
    type: StatsE1rmResponseDto,
    description: 'Только с add_e1rm и у упражнений с весом',
  })
  e1rm?: StatsE1rmResponseDto;
}
