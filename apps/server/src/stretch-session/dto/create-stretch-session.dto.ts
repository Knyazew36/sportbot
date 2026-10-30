import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsInt, IsOptional, Min } from 'class-validator';

export class CreateStretchSessionDto {
  @ApiProperty({ description: 'Комплекс растяжек' })
  @IsInt()
  @Min(1)
  routineId: number;

  @ApiPropertyOptional({ description: 'Время начала с клиента' })
  @IsOptional()
  @IsISO8601()
  at?: string;
}
