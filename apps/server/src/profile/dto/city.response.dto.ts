import { ApiProperty } from '@nestjs/swagger';

export class CityResponseDto {
  @ApiProperty({ example: 'Москва' })
  title: string;

  @ApiProperty({ example: 'Europe/Moscow' })
  zone: string;
}
