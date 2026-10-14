import { ApiProperty } from '@nestjs/swagger';

export class DraftLimitResponseDto {
  @ApiProperty({ description: 'Сколько заявок ещё можно отправить за сутки' })
  left: number;

  @ApiProperty({ description: 'Лимит в сутки' })
  limit: number;
}
