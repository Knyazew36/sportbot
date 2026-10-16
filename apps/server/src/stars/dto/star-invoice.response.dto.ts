import { ApiProperty } from '@nestjs/swagger';

export class StarInvoiceResponseDto {
  @ApiProperty({ description: 'id платежа' })
  id: number;

  @ApiProperty({
    example: 'https://t.me/$abcdef',
    description: 'Ссылка на счёт для WebApp.openInvoice',
  })
  invoiceUrl: string;
}
