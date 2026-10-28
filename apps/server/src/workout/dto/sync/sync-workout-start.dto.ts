import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';

import { SyncWorkoutItemDto } from './sync-workout-item.dto';

/** workout.start: тренировка, начатая на телефоне. */
export class SyncWorkoutStartDto {
  @IsUUID()
  complexClientId: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SyncWorkoutItemDto)
  items: SyncWorkoutItemDto[];
}
