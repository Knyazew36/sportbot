import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateWorkoutSetDto {
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

  // Предел по мере проверяет сервис: повторы до 999, у упражнения на время — секунды до 4 часов
  @ApiProperty({
    description: 'Повторы; у упражнения на время (measure TIME) — секунды',
  })
  @IsInt({ message: 'Повторы — целое число' })
  @Min(1, { message: 'Хотя бы 1 повтор' })
  @Max(14_400, { message: 'Слишком много' })
  reps: number;
}
