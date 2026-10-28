import { Matches } from 'class-validator';

/** day.skip: «сегодня не буду» — день ответа с телефона. */
export class SyncDayDateDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;
}
