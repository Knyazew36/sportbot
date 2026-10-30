import { IsISO8601 } from 'class-validator';

/** stretchSession.finish: занятие пройдено на телефоне. */
export class SyncStretchSessionFinishDto {
  @IsISO8601()
  finishedAt: string;
}
