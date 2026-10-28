import { IsInt, IsOptional, Matches } from 'class-validator';

/** limitation.create: зона и срок «до даты» или «до отмены» (null). */
export class SyncLimitationCreateDto {
  @IsInt()
  jointId: number;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate: string | null;
}
