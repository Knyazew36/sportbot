import { ApiProperty } from '@nestjs/swagger';

export class CatalogImageDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: unknown;
}
