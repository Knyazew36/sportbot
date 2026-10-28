import { IsIn, IsOptional, IsUUID } from 'class-validator';

/** day.fix: исправление отметки дня. clientId операции — день. */
export class SyncDayFixDto {
  @IsIn(['DONE', 'MISSED'])
  status: 'DONE' | 'MISSED';

  @IsOptional()
  @IsUUID()
  workoutClientId?: string;
}
