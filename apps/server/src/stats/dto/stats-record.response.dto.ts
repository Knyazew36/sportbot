import { ApiProperty } from '@nestjs/swagger';

import type { ProgressUnit } from '../stats.service';
import { StatsBestSetResponseDto } from './stats-best-set.response.dto';

export class StatsRecordResponseDto {
  @ApiProperty({ example: '2026-10-13' })
  date: string;

  @ApiProperty()
  exerciseId: number;

  @ApiProperty()
  name: string;

  @ApiProperty({
    enum: ['kg', 'reps', 'sec', 'min'],
    enumName: 'ProgressUnit',
  })
  unit: ProgressUnit;

  @ApiProperty({
    type: StatsBestSetResponseDto,
    description: 'Новый лучший подход',
  })
  set: StatsBestSetResponseDto;

  @ApiProperty({ type: StatsBestSetResponseDto, description: 'Прежний лучший' })
  previous: StatsBestSetResponseDto;
}
