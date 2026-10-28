import { IsInt, Min } from 'class-validator';

/** superset.ungroup: номер суперсета; clientId операции — комплекс. */
export class SyncSupersetDto {
  @IsInt()
  @Min(1)
  superset: number;
}
