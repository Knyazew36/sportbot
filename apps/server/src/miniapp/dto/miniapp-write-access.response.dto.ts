import { ApiProperty } from '@nestjs/swagger';

export class MiniappWriteAccessResponseDto {
  @ApiProperty({ description: 'Бот теперь может писать пользователю' })
  canMessage: boolean;
}
