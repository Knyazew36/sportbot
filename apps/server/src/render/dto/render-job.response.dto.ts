import { ApiProperty } from '@nestjs/swagger';
import { RENDER_STATUSES, type RenderStatus } from '@sportbot/render-contract';

export class RenderJobResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'lower-third' })
  compositionId: string;

  @ApiProperty({ example: 'mov-alpha' })
  format: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      'Props после проверки схемой — по ним фронт узнаёт файл для текущей формы',
  })
  props: Record<string, unknown>;

  @ApiProperty({ enum: RENDER_STATUSES })
  status: RenderStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Когда файл удалят по сроку хранения; null — файла нет',
  })
  expiresAt: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: '/uploads/renders/… — пока DONE и не истёк срок хранения',
  })
  url: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'lower-third-42.mov' })
  fileName: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Почему не отрендерилось',
  })
  error: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Попросили прислать в чат',
  })
  chatRequestedAt: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Бот отправил файл в чат',
  })
  deliveredAt: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Бот не смог отправить',
  })
  chatError: string | null;
}
