import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class AddCooldownStretchDto {
  @ApiPropertyOptional({
    description: 'На какую мышцу; без неё — случайная растяжка',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  muscleId?: number;
}
