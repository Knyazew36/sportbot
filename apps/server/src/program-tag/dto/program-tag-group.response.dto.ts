import { ApiProperty } from '@nestjs/swagger';

import { ProgramTagResponseDto } from './program-tag.response.dto';

/** Ряд чипов каталога: только теги, у которых есть опубликованные шаблоны. */
export class ProgramTagGroupResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'place', description: 'Параметр фильтра в ссылке' })
  code: string;

  @ApiProperty({ example: 'Где занимаешься' })
  name: string;

  @ApiProperty({ description: 'Порядок рядов чипов' })
  position: number;

  @ApiProperty({ type: [ProgramTagResponseDto] })
  tags: ProgramTagResponseDto[];
}
