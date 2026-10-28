import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

/** complex.reorder / complexItem.reorder: новый порядок clientId; clientId операции — родитель. */
export class SyncReorderDto {
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  ids: string[];
}
