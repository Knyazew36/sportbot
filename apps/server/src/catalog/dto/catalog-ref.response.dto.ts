import { ApiProperty } from '@nestjs/swagger';

/** Мышца или сустав справочника. */
export class CatalogRefResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;
}
