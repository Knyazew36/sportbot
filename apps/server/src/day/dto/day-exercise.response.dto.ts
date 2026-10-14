import { ApiProperty } from '@nestjs/swagger';

export class DayExerciseResponseDto {
  @ApiProperty({ description: 'Упражнение в комплексе (ComplexExercise)' })
  id: number;

  @ApiProperty()
  exerciseId: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Основные мышцы через « · »' })
  muscles: string;

  @ApiProperty()
  sets: number;

  @ApiProperty()
  repsMin: number;

  @ApiProperty()
  repsMax: number;

  @ApiProperty({
    type: [String],
    description: 'Зоны с активным ограничением, которые нагружает упражнение',
  })
  limitedZones: string[];
}
