import { IsDateString, IsInt, IsISO8601, IsString } from 'class-validator';

/** stretchSession.start: занятие начато на телефоне. */
export class SyncStretchSessionStartDto {
  @IsInt()
  routineId: number;

  @IsString()
  routineName: string;

  @IsDateString()
  date: string;

  @IsISO8601()
  startedAt: string;
}
