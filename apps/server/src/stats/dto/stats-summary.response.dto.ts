import { ApiProperty } from '@nestjs/swagger';

import { StatsAttendanceResponseDto } from './stats-attendance.response.dto';

export class StatsSummaryResponseDto {
  @ApiProperty({
    type: StatsAttendanceResponseDto,
    description: 'Текущая неделя',
  })
  week: StatsAttendanceResponseDto;

  @ApiProperty({
    type: StatsAttendanceResponseDto,
    description: 'Текущий месяц',
  })
  month: StatsAttendanceResponseDto;

  @ApiProperty()
  currentStreak: number;

  @ApiProperty()
  bestStreak: number;
}
