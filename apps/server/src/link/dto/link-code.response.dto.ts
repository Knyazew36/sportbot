import { ApiProperty } from '@nestjs/swagger';

export class LinkCodeResponseDto {
  @ApiProperty({
    enum: ['TELEGRAM', 'MAX'],
    description: 'Какой мессенджер привязываем',
  })
  channel: 'TELEGRAM' | 'MAX';

  @ApiProperty({ description: 'Одноразовая ссылка на бота, 15 минут' })
  url: string;
}
