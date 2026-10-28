import {
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/** set.add: подход, записанный на телефоне. clientId подхода — clientId операции. */
export class SyncSetAddDto {
  @IsUUID()
  itemClientId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999)
  weight: number;

  @IsInt()
  @Min(1)
  @Max(14_400)
  reps: number;

  @IsOptional()
  @IsISO8601()
  doneAt: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(14_400)
  workSeconds: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(14_400)
  restTargetSeconds: number | null;
}
