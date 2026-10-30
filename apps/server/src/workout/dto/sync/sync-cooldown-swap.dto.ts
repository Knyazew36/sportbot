import { IsInt } from 'class-validator';

/** cooldown.swap: «другая» на один раз. clientId операции — строка заминки. */
export class SyncCooldownSwapDto {
  @IsInt()
  nextStretchId: number;
}
