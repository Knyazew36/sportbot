import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class StatsUserQueryDto {
  @ApiPropertyOptional({
    description: 'Статистика друга; без параметра — своя',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;
}
