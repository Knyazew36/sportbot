import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class DayTodayQueryDto {
  @ApiPropertyOptional({
    description: 'Другой комплекс активной программы вместо предложенного',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  complexId?: number;
}
