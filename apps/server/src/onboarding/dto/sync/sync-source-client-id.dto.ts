import { IsInt, IsUUID } from 'class-validator';

/** Строка шаблона → clientId её копии, заведённой на телефоне. */
export class SyncSourceClientIdDto {
  @IsInt()
  sourceId: number;

  @IsUUID()
  clientId: string;
}
