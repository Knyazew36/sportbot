import { ApiProperty } from '@nestjs/swagger';

import {
  SyncBodyWeightRowDto,
  SyncComplexExerciseRowDto,
  SyncComplexRowDto,
  SyncDeletedRowDto,
  SyncLimitationRowDto,
  SyncPauseRowDto,
  SyncPlanDayRowDto,
  SyncProfileRowDto,
  SyncProgramRowDto,
  SyncStretchExclusionRowDto,
  SyncWorkoutExerciseRowDto,
  SyncWorkoutRowDto,
  SyncWorkoutSetRowDto,
  SyncWorkoutStretchRowDto,
} from './sync-rows.response.dto';

export class SyncPullResponseDto {
  @ApiProperty({
    description:
      'Передать в следующий pull как since. Берётся с запасом назад — часть строк придёт повторно, применять их можно сколько угодно раз',
  })
  cursor: string;

  @ApiProperty({
    description:
      'Полный снимок: строки, которых нет в ответе, на клиенте удалить (кроме ещё не отправленных)',
  })
  full: boolean;

  @ApiProperty({
    type: SyncProfileRowDto,
    nullable: true,
    description: 'null — профиль не менялся с since',
  })
  profile: SyncProfileRowDto | null;

  @ApiProperty({ type: [SyncProgramRowDto] })
  programs: SyncProgramRowDto[];

  @ApiProperty({ type: [SyncComplexRowDto] })
  complexes: SyncComplexRowDto[];

  @ApiProperty({ type: [SyncComplexExerciseRowDto] })
  complexExercises: SyncComplexExerciseRowDto[];

  @ApiProperty({ type: [SyncPlanDayRowDto] })
  planDays: SyncPlanDayRowDto[];

  @ApiProperty({ type: [SyncWorkoutRowDto] })
  workouts: SyncWorkoutRowDto[];

  @ApiProperty({ type: [SyncWorkoutExerciseRowDto] })
  workoutExercises: SyncWorkoutExerciseRowDto[];

  @ApiProperty({ type: [SyncWorkoutSetRowDto] })
  workoutSets: SyncWorkoutSetRowDto[];

  @ApiProperty({ type: [SyncWorkoutStretchRowDto] })
  workoutStretches: SyncWorkoutStretchRowDto[];

  @ApiProperty({ type: [SyncPauseRowDto] })
  pauses: SyncPauseRowDto[];

  @ApiProperty({ type: [SyncLimitationRowDto] })
  limitations: SyncLimitationRowDto[];

  @ApiProperty({ type: [SyncStretchExclusionRowDto] })
  stretchExclusions: SyncStretchExclusionRowDto[];

  @ApiProperty({ type: [SyncBodyWeightRowDto] })
  bodyWeights: SyncBodyWeightRowDto[];

  @ApiProperty({
    type: [SyncDeletedRowDto],
    description: 'Удалённые с since; при полном снимке пусто',
  })
  deleted: SyncDeletedRowDto[];
}
