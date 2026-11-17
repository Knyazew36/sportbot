import { ApiProperty } from '@nestjs/swagger';

export class FeedbackReplyResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Спасибо, уже в работе' })
  text: string;

  @ApiProperty({ example: '2026-11-04T12:00:00.000Z' })
  createdAt: string;
}

export class FeedbackResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Хочу видеть вес прошлой тренировки в подходе' })
  text: string;

  @ApiProperty({ example: '2026-11-04T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ type: [FeedbackReplyResponseDto] })
  replies: FeedbackReplyResponseDto[];
}
