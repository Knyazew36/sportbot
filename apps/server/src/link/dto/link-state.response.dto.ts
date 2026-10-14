import { ApiProperty } from '@nestjs/swagger';

const CHANNELS = ['TELEGRAM', 'MAX'];

export class LinkStateResponseDto {
  @ApiProperty({
    enum: CHANNELS,
    isArray: true,
    description: 'Привязанные мессенджеры',
  })
  linked: ('TELEGRAM' | 'MAX')[];

  @ApiProperty({
    enum: CHANNELS,
    isArray: true,
    description: 'Куда бот пишет сам; пусто — не выбрано (пишет в Telegram)',
  })
  notify: ('TELEGRAM' | 'MAX')[];

  @ApiProperty({
    enum: CHANNELS,
    isArray: true,
    description: 'В каких мессенджерах подключён бот',
  })
  available: ('TELEGRAM' | 'MAX')[];
}
