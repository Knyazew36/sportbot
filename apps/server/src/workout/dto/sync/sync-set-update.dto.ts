import { IsInt, IsNumber, Max, Min } from 'class-validator';

/** set.update: исправленный подход. */
export class SyncSetUpdateDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999)
  weight: number;

  @IsInt()
  @Min(1)
  @Max(14_400)
  reps: number;
}
