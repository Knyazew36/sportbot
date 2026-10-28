import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** complex.update: название и/или разминка (null — как в профиле, 0 — без разминки). */
export class SyncComplexUpdateDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsIn([null, 0, 5, 10, 15])
  warmupMinutes?: number | null;
}
