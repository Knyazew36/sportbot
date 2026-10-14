import { ApiProperty } from '@nestjs/swagger';

export class ImportReportResponseDto {
  @ApiProperty({
    description: 'Сколько записей создано (или будет создано при проверке)',
  })
  create: number;

  @ApiProperty()
  update: number;

  @ApiProperty({ type: [String], description: 'Ошибки по строкам' })
  errors: string[];
}
