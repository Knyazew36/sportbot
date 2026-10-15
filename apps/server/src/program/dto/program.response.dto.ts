import { ApiProperty } from '@nestjs/swagger';

import { ProgramTagResponseDto } from '@/program-tag/dto/program-tag.response.dto';

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

  @ApiProperty({ description: 'Копия шаблона из каталога' })
  fromTemplate: boolean;

  @ApiProperty({
    description:
      'Источник копии (друг или шаблон) изменился после копирования, и «Не сейчас» ещё не нажимали',
  })
  sourceUpdated: boolean;

  @ApiProperty({
    description: 'Шаблон виден в каталоге; у программы пользователя false',
  })
  isPublished: boolean;

  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Каталог: последняя копия этого шаблона у пользователя («уже у тебя»); в остальных ответах null',
  })
  takenProgramId: number | null;

  @ApiProperty({
    type: [ProgramTagResponseDto],
    description:
      'Теги шаблона по порядку чипов; у программы пользователя пусто',
  })
  tags: ProgramTagResponseDto[];

  @ApiProperty({ type: [ProgramComplexResponseDto] })
  complexes: ProgramComplexResponseDto[];
}
