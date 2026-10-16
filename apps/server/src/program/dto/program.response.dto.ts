import { ApiProperty } from '@nestjs/swagger';

import { ProgramPublication } from '@/generated/prisma/client';
import { ProgramTagResponseDto } from '@/program-tag/dto/program-tag.response.dto';

import { ProgramAuthorResponseDto } from './program-author.response.dto';
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
      'Теги по порядку чипов: у шаблона и опубликованной программы; своя программа — со своими тегами на проверке',
  })
  tags: ProgramTagResponseDto[];

  @ApiProperty({ type: [ProgramComplexResponseDto] })
  complexes: ProgramComplexResponseDto[];

  @ApiProperty({
    description: 'Сколько раз программу взяли себе (живые копии)',
  })
  addedCount: number;

  @ApiProperty({
    type: ProgramAuthorResponseDto,
    nullable: true,
    description:
      'Каталог «Программы пользователей»: автор; в остальных ответах null',
  })
  author: ProgramAuthorResponseDto | null;

  @ApiProperty({ description: 'Каталог: это программа самого пользователя' })
  mine: boolean;

  @ApiProperty({
    enum: ProgramPublication,
    enumName: 'ProgramPublication',
    description: 'Публикация в каталоге «Программы пользователей»',
  })
  publication: ProgramPublication;

  @ApiProperty({
    description:
      'Публикация или правка названия/описания ждёт проверки администратора',
  })
  textPending: boolean;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Причина отказа или снятия — видна только автору',
  })
  rejectReason: string | null;
}
