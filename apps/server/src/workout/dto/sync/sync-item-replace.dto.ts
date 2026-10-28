import { IsBoolean, IsInt } from 'class-validator';

/** item.replace: замена упражнения тренировки. */
export class SyncItemReplaceDto {
  @IsInt()
  exerciseId: number;

  @IsBoolean()
  inComplex: boolean;
}
