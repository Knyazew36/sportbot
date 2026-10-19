import { ApiProperty } from '@nestjs/swagger';

import { StatsBestSetResponseDto } from './stats-best-set.response.dto';

/** Точка прогресса: лучший подход тренировки. */
export class StatsProgressPointResponseDto extends StatsBestSetResponseDto {
  @ApiProperty({ example: '2026-10-13' })
  date: string;
}
