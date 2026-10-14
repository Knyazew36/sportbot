import { ApiProperty } from '@nestjs/swagger';

export class DayPauseResponseDto {
  @ApiProperty({
    type: String,
    nullable: true,
    example: '2026-10-20',
    description: 'Последний день паузы; null — до отмены',
  })
  endDate: string | null;

  @ApiProperty({ description: 'Срок вышел — спросить «Возвращаемся?»' })
  expired: boolean;
}
