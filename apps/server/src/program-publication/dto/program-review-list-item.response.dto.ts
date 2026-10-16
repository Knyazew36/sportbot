import { ApiProperty } from '@nestjs/swagger';

import { ProgramPublication } from '@/generated/prisma/client';

export class ProgramReviewListItemResponseDto {
  @ApiProperty({ description: 'Id программы' })
  id: number;

  @ApiProperty({ description: 'Текущее название у автора' })
  name: string;

  @ApiProperty({ type: String, nullable: true })
  author: string | null;

  @ApiProperty({ enum: ProgramPublication, enumName: 'ProgramPublication' })
  publication: ProgramPublication;

  @ApiProperty({
    description:
      'Название или описание ждут проверки (первая публикация или правка)',
  })
  textPending: boolean;

  @ApiProperty({ description: 'Свои теги автора, ждущие решения' })
  pendingTagCount: number;

  @ApiProperty({ type: Date, nullable: true })
  reviewRequestedAt: Date | null;
}
