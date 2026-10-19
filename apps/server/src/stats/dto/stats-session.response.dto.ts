import { ApiProperty } from '@nestjs/swagger';

import { StatsDaySetResponseDto } from './stats-day-set.response.dto';

/** Тренировка в истории упражнения. */
export class StatsSessionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: '2026-10-13' })
  date: string;

  @ApiProperty({ type: [StatsDaySetResponseDto] })
  sets: StatsDaySetResponseDto[];

  @ApiProperty({
    description: 'Номер лучшего подхода в sets; -1 — подходов с весом нет',
  })
  bestIndex: number;

  @ApiProperty({ description: 'Лучший подход побил все прежние' })
  isRecord: boolean;
}
