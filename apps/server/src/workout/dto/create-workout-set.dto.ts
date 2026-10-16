import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateWorkoutSetDto {
  @ApiProperty({ description: 'Упражнение тренировки (WorkoutExercise)' })
  @IsInt()
  itemId: number;

  @ApiPropertyOptional({
    description: 'Вес, кг; без веса — 0 или не передавать',
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Вес — число, до двух знаков после точки' },
  )
  @Min(0, { message: 'Вес не меньше 0' })
  @Max(999, { message: 'Вес до 999 кг' })
  weight?: number;

  @ApiProperty()
  @IsInt({ message: 'Повторы — целое число' })
  @Min(1, { message: 'Хотя бы 1 повтор' })
  @Max(999, { message: 'Повторов до 999' })
  reps: number;

  @ApiPropertyOptional({
    description:
      'uuid подхода с клиента: повтор того же запроса не создаёт второй подход',
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;
}
