import { IsString, MaxLength } from 'class-validator';

/** program.create / program.rename: название; пустое и длинное отклонит сервис. */
export class SyncNameDto {
  @IsString()
  @MaxLength(200)
  name: string;
}
