import { ApiProperty } from '@nestjs/swagger';

export class MyEntryResponseDto {
  @ApiProperty({ description: 'Заявка на модерацию' })
  id: number;

  @ApiProperty({ enum: ['exercise', 'stretch'] })
  kind: 'exercise' | 'stretch';

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Запись: черновик, одобренная или запись-оригинал для дубля',
  })
  entryId: number | null;

  @ApiProperty()
  name: string;

  @ApiProperty({
    enum: ['PENDING', 'APPROVED', 'APPROVED_EDITED', 'DUPLICATE', 'REJECTED'],
  })
  outcome:
    'PENDING' | 'APPROVED' | 'APPROVED_EDITED' | 'DUPLICATE' | 'REJECTED';

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Причина для автора',
  })
  reason: string | null;

  @ApiProperty()
  createdAt: Date;
}
