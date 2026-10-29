import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsISO8601,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';

import { SyncWorkoutItemDto } from './sync-workout-item.dto';

/** workout.manual: прошедшая тренировка, добавленная вручную на телефоне, — сразу закрытая. */
export class SyncWorkoutManualDto {
  @IsUUID()
  complexClientId: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  /** Время тренировки на телефоне: начало и конец совпадают — длительности у ручной нет */
  @IsISO8601()
  at: string;

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SyncWorkoutItemDto)
  items: SyncWorkoutItemDto[];
}
