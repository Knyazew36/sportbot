import { ApiProperty } from '@nestjs/swagger';

import { ProgramExerciseResponseDto } from './program-exercise.response.dto';

export class ProgramComplexResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  position: number;

  @ApiProperty({ type: String, nullable: true })
  cardioName: string | null;

  @ApiProperty({ type: Number, nullable: true })
  cardioMinutes: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Разминка, мин: null — как в профиле, 0 — без разминки',
  })
  warmupMinutes: number | null;

  @ApiProperty({ description: 'Следующий по очереди' })
  isNext: boolean;

  @ApiProperty({ type: [ProgramExerciseResponseDto] })
  exercises: ProgramExerciseResponseDto[];
}
