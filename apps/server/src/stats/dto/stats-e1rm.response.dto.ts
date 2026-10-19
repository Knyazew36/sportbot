import { ApiProperty } from '@nestjs/swagger';

import { StatsE1rmSetResponseDto } from './stats-e1rm-set.response.dto';
import { StatsPointResponseDto } from './stats-point.response.dto';

/** Расчётный 1ПМ по Эпли: оценка, не замер. */
export class StatsE1rmResponseDto {
  @ApiProperty({
    type: StatsE1rmSetResponseDto,
    nullable: true,
    description: 'По последней тренировке; null — подходов с весом нет',
  })
  current: StatsE1rmSetResponseDto | null;

  @ApiProperty({
    type: StatsE1rmSetResponseDto,
    nullable: true,
    description: 'Лучший за период; null — в периоде подходов с весом нет',
  })
  best: StatsE1rmSetResponseDto | null;

  @ApiProperty({ type: [StatsPointResponseDto], description: 'Точки за период' })
  points: StatsPointResponseDto[];
}
