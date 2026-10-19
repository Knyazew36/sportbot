import { ApiProperty } from '@nestjs/swagger';

export class MyEntryResponseDto {
  @ApiProperty({ description: 'Своя запись: упражнение или растяжка' })
  id: number;

  @ApiProperty({ enum: ['exercise', 'stretch'] })
  kind: 'exercise' | 'stretch';

  @ApiProperty()
  name: string;

  @ApiProperty({
    enum: ['CATALOG', 'DRAFT'],
    description: 'CATALOG — в общем справочнике, DRAFT — видна только автору',
  })
  status: 'CATALOG' | 'DRAFT';

  @ApiProperty({
    enum: ['PENDING', 'APPROVED', 'APPROVED_EDITED', 'DUPLICATE', 'REJECTED'],
    nullable: true,
    description: 'Исход последней заявки; null — на проверку не отправлялась',
  })
  outcome:
    | 'PENDING'
    | 'APPROVED'
    | 'APPROVED_EDITED'
    | 'DUPLICATE'
    | 'REJECTED'
    | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Причина последнего решения для автора',
  })
  reason: string | null;

  @ApiProperty()
  createdAt: Date;
}
