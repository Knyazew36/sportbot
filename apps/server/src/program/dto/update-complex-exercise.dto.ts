import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

// Предел повторов по мере проверяет сервис: повторы до 200, у упражнения на время — секунды до 4 часов
export class UpdateComplexExerciseDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1, { message: 'Подходов — от 1' })
  @Max(20, { message: 'Подходов — до 20' })
  sets: number;

  @ApiProperty({ example: 8, description: 'Повторы; у упражнения на время — секунды' })
  @IsInt()
  @Min(1, { message: 'Повторов — от 1' })
  @Max(14_400, { message: 'Слишком много' })
  repsMin: number;

  @ApiProperty({ example: 12, description: 'Повторы; у упражнения на время — секунды' })
  @IsInt()
  @Min(1, { message: 'Повторов — от 1' })
  @Max(14_400, { message: 'Слишком много' })
  repsMax: number;
}
