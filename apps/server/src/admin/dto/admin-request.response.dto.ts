import { ApiProperty } from '@nestjs/swagger';

import { AdminEntryResponseDto } from './admin-entry.response.dto';
import { AdminSimilarResponseDto } from './admin-similar.response.dto';

export class AdminRequestResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: ['exercise', 'stretch'] })
  kind: 'exercise' | 'stretch';

  @ApiProperty({ type: String, nullable: true })
  author: string | null;

  @ApiProperty({
    enum: ['PENDING', 'APPROVED', 'APPROVED_EDITED', 'DUPLICATE', 'REJECTED'],
  })
  outcome:
    'PENDING' | 'APPROVED' | 'APPROVED_EDITED' | 'DUPLICATE' | 'REJECTED';

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: AdminEntryResponseDto, nullable: true })
  entry: AdminEntryResponseDto | null;

  @ApiProperty({
    type: [AdminSimilarResponseDto],
    description: 'Похожие записи справочника',
  })
  similar: AdminSimilarResponseDto[];
}
