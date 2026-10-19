import { ApiProperty } from '@nestjs/swagger';

/** Лучший подход: вес и повторы; value — то, что рисуется на графике (кг, повторы, с или мин). */
export class StatsBestSetResponseDto {
  @ApiProperty({ description: 'Вес, кг; 0 — упражнение без веса' })
  weight: number;

  @ApiProperty({ description: 'Повторы; у упражнений на время — секунды' })
  reps: number;

  @ApiProperty()
  value: number;
}
