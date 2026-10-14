import { ApiProperty } from '@nestjs/swagger';

export class ImportFileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'JSON-файл импорта',
  })
  file: unknown;
}
