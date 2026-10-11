import { ApiProperty } from '@nestjs/swagger';

export class UnreadCountDto {
  @ApiProperty({ description: 'Количество уведомлений' })
  count: number;
}
