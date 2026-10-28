import { IsInt } from 'class-validator';

/** complexItem.update: план подходов; границы по мере проверит сервис. */
export class SyncPlanDto {
  @IsInt()
  sets: number;

  @IsInt()
  repsMin: number;

  @IsInt()
  repsMax: number;
}
