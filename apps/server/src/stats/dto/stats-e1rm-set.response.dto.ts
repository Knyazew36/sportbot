import { ApiProperty } from '@nestjs/swagger';

/** Расчётный 1ПМ и подход, по которому он посчитан. */
export class StatsE1rmSetResponseDto {
  @ApiProperty({ description: 'Расчётный 1ПМ, кг' })
  value: number;

  @ApiProperty({ description: 'Вес подхода, кг' })
  weight: number;

  @ApiProperty({
    description: 'Повторы подхода: больше 10 — оценка заметно грубее',
  })
  reps: number;
}
