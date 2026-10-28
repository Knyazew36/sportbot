import { IsInt, IsOptional, IsUUID } from 'class-validator';

/** cooldown.exclude: «не предлагать». clientId операции — строка заминки. */
export class SyncCooldownExcludeDto {
  @IsInt()
  stretchId: number;

  @IsOptional()
  @IsInt()
  nextStretchId: number | null;

  /** clientId исключения, заведённого на телефоне */
  @IsOptional()
  @IsUUID()
  exclusionClientId?: string;
}
