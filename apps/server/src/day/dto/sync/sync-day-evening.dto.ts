import { IsBoolean, IsOptional, IsUUID, Matches } from 'class-validator';

/** day.evening: вечерний ответ. «Да» создаёт простую тренировку с clientId телефона. */
export class SyncDayEveningDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsBoolean()
  yes: boolean;

  @IsOptional()
  @IsUUID()
  workoutClientId?: string;
}
