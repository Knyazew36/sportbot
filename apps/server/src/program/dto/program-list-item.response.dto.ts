import { ApiProperty } from '@nestjs/swagger';

export class ProgramListItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  complexCount: number;

  @ApiProperty()
  active: boolean;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Копия от друга: его имя',
  })
  fromFriend: string | null;

  @ApiProperty({ description: 'Копия шаблона из каталога' })
  fromTemplate: boolean;

  @ApiProperty({
    description:
      'Источник копии (друг или шаблон) изменился после копирования, и «Не сейчас» ещё не нажимали',
  })
  sourceUpdated: boolean;
}
