import { ApiProperty } from '@nestjs/swagger';

export class CatalogSimilarResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}
