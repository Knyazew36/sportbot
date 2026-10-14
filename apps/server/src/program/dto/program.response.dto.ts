import { ApiProperty } from '@nestjs/swagger';

import { ProgramComplexResponseDto } from './program-complex.response.dto';

export class ProgramResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Описание шаблона',
  })
  description: string | null;

  @ApiProperty({ description: 'Активная программа пользователя' })
  active: boolean;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Копия программы друга: его имя',
  })
  fromFriend: string | null;

  @ApiProperty({ description: 'Друг обновил программу после копирования' })
  sourceUpdated: boolean;

  @ApiProperty({ type: [ProgramComplexResponseDto] })
  complexes: ProgramComplexResponseDto[];
}
