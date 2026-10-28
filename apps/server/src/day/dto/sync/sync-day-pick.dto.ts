import { IsUUID, Matches } from 'class-validator';

/** day.pick: «другая тренировка» до начала. */
export class SyncDayPickDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsUUID()
  complexClientId: string;
}
