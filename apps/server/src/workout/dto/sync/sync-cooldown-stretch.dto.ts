import { IsIn, IsInt, IsUUID, Min } from 'class-validator';

/** Растяжка заминки, собранной на телефоне. */
export class SyncCooldownStretchDto {
  @IsUUID()
  clientId: string;

  @IsInt()
  stretchId: number;

  @IsIn(['MAIN', 'OPTIONAL'])
  block: 'MAIN' | 'OPTIONAL';

  @IsInt()
  @Min(1)
  position: number;
}
