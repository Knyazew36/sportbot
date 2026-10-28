import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** Упражнение тренировки, созданное на телефоне при старте: план — копия комплекса. */
export class SyncWorkoutItemDto {
  @IsUUID()
  clientId: string;

  @IsInt()
  exerciseId: number;

  @IsInt()
  position: number;

  @IsInt()
  @Min(1)
  plannedSets: number;

  @IsInt()
  @Min(1)
  repsMin: number;

  @IsInt()
  @Min(1)
  repsMax: number;

  @IsOptional()
  @IsInt()
  superset: number | null;
}
