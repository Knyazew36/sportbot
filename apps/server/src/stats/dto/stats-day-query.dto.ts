import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

import { StatsUserQueryDto } from './stats-user-query.dto';

export class StatsDayQueryDto extends StatsUserQueryDto {
  @ApiProperty({ example: '2026-10-13' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Дата в формате ГГГГ-ММ-ДД' })
  date: string;
}
