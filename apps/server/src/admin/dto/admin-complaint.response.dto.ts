import { ApiProperty } from '@nestjs/swagger';

import { AdminComplaintChangeResponseDto } from './admin-complaint-change.response.dto';

export class AdminComplaintResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ description: 'Текст жалобы или комментарий к правке' })
  text: string;

  @ApiProperty({
    type: [AdminComplaintChangeResponseDto],
    description: 'Предложенная правка; пусто — жалоба текстом',
  })
  changes: AdminComplaintChangeResponseDto[];

  @ApiProperty({ enum: ['OPEN', 'RESOLVED', 'REJECTED'] })
  status: 'OPEN' | 'RESOLVED' | 'REJECTED';

  @ApiProperty({ enum: ['exercise', 'stretch'] })
  kind: 'exercise' | 'stretch';

  @ApiProperty({ type: Number, nullable: true })
  entryId: number | null;

  @ApiProperty()
  entryName: string;

  @ApiProperty({ type: String, nullable: true })
  author: string | null;

  @ApiProperty()
  createdAt: Date;
}
