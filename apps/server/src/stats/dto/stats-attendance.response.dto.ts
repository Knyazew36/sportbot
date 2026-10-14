import { ApiProperty } from '@nestjs/swagger';

export class StatsAttendanceResponseDto {
  @ApiProperty({ description: 'Тренировок сделано' })
  done: number;

  @ApiProperty({ description: 'Тренировочных дней прошло' })
  planned: number;

  @ApiProperty({ description: 'Посещаемость, %' })
  percent: number;
}
