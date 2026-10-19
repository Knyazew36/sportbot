import { ApiProperty } from '@nestjs/swagger';

export class ProgramShareLinkResponseDto {
  @ApiProperty({
    description:
      'Ссылка для «Поделиться»: на бота того мессенджера, откуда открыто приложение',
  })
  url: string;

  @ApiProperty({ description: 'Текст к ссылке' })
  text: string;
}
