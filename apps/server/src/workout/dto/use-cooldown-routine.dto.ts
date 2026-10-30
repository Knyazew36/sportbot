import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UseCooldownRoutineDto {
  @ApiProperty({ description: 'Комплекс растяжек' })
  @IsInt()
  @Min(1)
  routineId: number;
}
