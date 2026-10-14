import { ApiProperty } from '@nestjs/swagger';

export class CatalogImageResponseDto {
  @ApiProperty({
    example: 'catalog/uuid.jpg',
    description: 'Передать в imagePath записи',
  })
  imagePath: string;

  @ApiProperty({ example: '/uploads/catalog/uuid.jpg' })
  imageUrl: string;
}
