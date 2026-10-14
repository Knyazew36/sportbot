import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateComplexExerciseDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1, { message: 'Подходов — от 1' })
  @Max(20, { message: 'Подходов — до 20' })
  sets: number;

  @ApiProperty({ example: 8 })
  @IsInt()
  @Min(1, { message: 'Повторов — от 1' })
  @Max(200, { message: 'Повторов — до 200' })
  repsMin: number;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1, { message: 'Повторов — от 1' })
  @Max(200, { message: 'Повторов — до 200' })
  repsMax: number;
}
