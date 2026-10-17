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
    enum: ['REPS', 'TIME', 'MINUTES'],
    description: 'Чем меряется: TIME — в repsMin/repsMax секунды',
  })
  measure: 'REPS' | 'TIME' | 'MINUTES';

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Номер суперсета в комплексе; участники идут подряд',
  })
  superset: number | null;

  @ApiProperty({
    type: [String],
    description: 'Зоны с активным ограничением, которые нагружает упражнение',
  })
  limitedZones: string[];
}
