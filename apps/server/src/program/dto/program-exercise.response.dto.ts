import { ApiProperty } from '@nestjs/swagger';

export class ProgramExerciseResponseDto {
  @ApiProperty({ description: 'Упражнение в комплексе (ComplexExercise)' })
  id: number;

  @ApiProperty()
  exerciseId: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Основные мышцы через « · »' })
  muscles: string;

  @ApiProperty({ description: 'Личный черновик — «не проверено»' })
  draft: boolean;

  @ApiProperty()
  sets: number;

  @ApiProperty()
  repsMin: number;

  @ApiProperty()
  repsMax: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Номер суперсета в комплексе; участники идут подряд',
  })
  superset: number | null;
}
