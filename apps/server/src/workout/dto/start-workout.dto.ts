import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class StartWorkoutDto {
  @ApiPropertyOptional({
    description:
      'Комплекс активной программы; без него — комплекс дня по очереди',
  })
  @IsOptional()
  @IsInt()
  complexId?: number;
}
