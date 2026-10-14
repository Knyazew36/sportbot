import { ApiProperty } from '@nestjs/swagger';

import { CatalogRefResponseDto } from './catalog-ref.response.dto';

export class CatalogStretchResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Как делать' })
  howTo: string | null;

  @ApiProperty({ description: 'Удержание, с' })
  holdSeconds: number;

  @ApiProperty({ description: 'На каждую сторону' })
  perSide: boolean;

  @ApiProperty({ type: [CatalogRefResponseDto] })
  muscles: CatalogRefResponseDto[];

  @ApiProperty({ description: 'Личный черновик — «не проверено»' })
  draft: boolean;
}
