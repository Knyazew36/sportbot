import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

import { StatsPeriodQueryDto } from './stats-period-query.dto';

export class StatsProgressQueryDto extends StatsPeriodQueryDto {
  @ApiPropertyOptional({
    description: 'Добавить расчётный 1ПМ (только упражнения с весом)',
  })
  @IsOptional()
  // Query-строка: @Type(() => Boolean) даёт Boolean('false') === true — приводим по значению строки
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  add_e1rm?: boolean;
}
