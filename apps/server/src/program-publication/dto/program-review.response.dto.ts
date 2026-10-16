import { ApiProperty } from '@nestjs/swagger';

import { ProgramPublication } from '@/generated/prisma/client';
import { ProgramComplexResponseDto } from '@/program/dto/program-complex.response.dto';
import { ProgramTagResponseDto } from '@/program-tag/dto/program-tag.response.dto';

/** Программа на проверке: что видит администратор перед решением. */
export class ProgramReviewResponseDto {
  @ApiProperty({ description: 'Id программы' })
  id: number;

  @ApiProperty({ description: 'Текущее название у автора' })
  name: string;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Одобренное название — сейчас в каталоге',
  })
  publishedName: string | null;

  @ApiProperty({ type: String, nullable: true })
  publishedDescription: string | null;

  @ApiProperty({ enum: ProgramPublication, enumName: 'ProgramPublication' })
  publication: ProgramPublication;

  @ApiProperty()
  textPending: boolean;

  @ApiProperty({ type: Number, nullable: true })
  authorId: number | null;

  @ApiProperty({ type: String, nullable: true })
  author: string | null;

  @ApiProperty({
    type: [ProgramTagResponseDto],
    description:
      'Теги программы; isApproved=false — свой тег автора на решении',
  })
  tags: ProgramTagResponseDto[];

  @ApiProperty({ type: [ProgramComplexResponseDto] })
  complexes: ProgramComplexResponseDto[];
}
