import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsISO8601,
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

  // Предел по мере проверяет сервис: повторы до 999, у упражнения на время — секунды до 4 часов
  @ApiProperty({
    description: 'Повторы; у упражнения на время (measure TIME) — секунды',
  })
  @IsInt({ message: 'Повторы — целое число' })
  @Min(1, { message: 'Хотя бы 1 повтор' })
  @Max(14_400, { message: 'Слишком много' })
  reps: number;

  @ApiPropertyOptional({
    description:
      'uuid подхода с клиента: повтор того же запроса не создаёт второй подход',
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({
    description:
      'Когда записали подход на клиенте (ISO). Офлайн-подход доезжает позже — время берётся отсюда',
  })
  @IsOptional()
  @IsISO8601()
  doneAt?: string;

  @ApiPropertyOptional({
    description: 'Чистое время подхода по секундомеру, с; нет — ручной ввод',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(14_400)
  workSeconds?: number;

  @ApiPropertyOptional({
    description: 'План отдыха перед подходом, с; нет — таймер не запускали',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3600)
  restTargetSeconds?: number;
}
