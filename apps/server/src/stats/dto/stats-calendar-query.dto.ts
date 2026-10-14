import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

import { StatsUserQueryDto } from './stats-user-query.dto';

export class StatsCalendarQueryDto extends StatsUserQueryDto {
  @ApiProperty({ example: '2026-10', description: 'Месяц, YYYY-MM' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'Месяц в формате ГГГГ-ММ' })
  month: string;
}
