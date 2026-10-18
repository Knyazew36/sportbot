import { ApiProperty } from '@nestjs/swagger';
import {
  RENDER_DELIVERIES,
  RENDER_STATUSES,
  type RenderDelivery,
  type RenderStatus,
} from '@sportbot/render-contract';

export class RenderJobResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'lower-third' })
  compositionId: string;

  @ApiProperty({ example: 'webm-alpha' })
  format: string;

  @ApiProperty({ enum: RENDER_DELIVERIES })
  delivery: RenderDelivery;

  @ApiProperty({ enum: RENDER_STATUSES })
  status: RenderStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    description: '/uploads/renders/… — пока DONE и не истёк срок хранения',
  })
  url: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'lower-third-42.webm' })
  fileName: string | null;

  @ApiProperty({ type: String, nullable: true })
  error: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Бот отправил файл в чат (для CHAT)',
  })
  deliveredAt: string | null;
}
