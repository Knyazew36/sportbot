import { IsString, IsUUID, MaxLength } from 'class-validator';

/** complex.add: новый комплекс в конец программы. clientId операции — комплекс. */
export class SyncComplexAddDto {
  @IsUUID()
  programClientId: string;

  @IsString()
  @MaxLength(200)
  name: string;
}
