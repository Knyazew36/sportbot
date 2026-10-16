import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class ReplaceProgramTagDto {
  @ApiProperty({ description: 'Тег справочника той же группы' })
  @IsInt()
  targetId: number;
}
