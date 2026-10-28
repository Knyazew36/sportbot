import { IsBoolean } from 'class-validator';

/** day.reschedule: ответ на «напомнить завтра?». clientId операции — пропущенный день. */
export class SyncDayRescheduleDto {
  @IsBoolean()
  accept: boolean;
}
