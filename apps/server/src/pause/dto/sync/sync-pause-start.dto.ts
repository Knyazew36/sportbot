import { IsOptional, Matches } from 'class-validator';

/** pause.start: пауза до даты (последний день включительно) или до отмены (null). */
export class SyncPauseStartDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate: string | null;
}
