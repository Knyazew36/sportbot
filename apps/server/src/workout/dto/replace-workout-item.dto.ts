import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt } from 'class-validator';

export class ReplaceWorkoutItemDto {
  @ApiProperty({ description: 'Аналог из списка замены' })
  @IsInt()
  exerciseId: number;

  @ApiProperty({ description: 'Заменить и в комплексе, а не только сегодня' })
  @IsBoolean()
  inComplex: boolean;
}
