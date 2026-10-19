import { ApiProperty } from '@nestjs/swagger';

import type { ProgressStatus, ProgressUnit } from '../stats.service';
import { StatsBestSetResponseDto } from './stats-best-set.response.dto';

const UNITS = ['kg', 'reps', 'sec', 'min'];

export class StatsProgressItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({
    enum: UNITS,
    enumName: 'ProgressUnit',
    description:
      'В чём прогресс: kg — лучший подход по весу; reps — без веса, по повторам; sec/min — на время',
  })
  unit: ProgressUnit;

  @ApiProperty({
    type: StatsBestSetResponseDto,
    description: 'Лучший подход за всё время',
  })
  best: StatsBestSetResponseDto;

  @ApiProperty({
    description:
      'Рост за период: лучшая тренировка против первой; 0 — не выросло',
  })
  delta: number;

  @ApiProperty({
    enum: UNITS,
    enumName: 'ProgressUnit',
    description: 'В чём рост: у упражнения с весом — reps, если вес не менялся',
  })
  deltaUnit: ProgressUnit;

  @ApiProperty({ description: 'Тренировок с упражнением за период' })
  sessions: number;

  @ApiProperty({ example: '2026-10-13' })
  lastDate: string;

  @ApiProperty({
    enum: ['growing', 'flat', 'stalled', 'idle'],
    enumName: 'ProgressStatus',
    description:
      'growing — растёт; flat — без изменений; stalled — 3 недели без роста; idle — в периоде не делали',
  })
  status: ProgressStatus;

  @ApiProperty({
    type: [Number],
    description: 'Значения для мини-графика за период',
  })
  spark: number[];
}
