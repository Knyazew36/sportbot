import { IsInt, IsUUID } from 'class-validator';

/** cooldown.add: ещё растяжка, выбранная на телефоне. clientId операции — тренировка. */
export class SyncCooldownAddDto {
  /** clientId новой строки заминки */
  @IsUUID()
  clientId: string;

  @IsInt()
  stretchId: number;

  @IsInt()
  position: number;
}
