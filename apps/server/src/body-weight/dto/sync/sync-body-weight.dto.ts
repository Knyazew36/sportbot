import { IsNumber, Matches, Max, Min } from 'class-validator';

/** bodyWeight.add: вес за день, когда его ввели на телефоне. */
export class SyncBodyWeightDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20)
  @Max(400)
  value: number;
}
