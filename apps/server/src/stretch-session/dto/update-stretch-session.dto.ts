import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';

export class UpdateStretchSessionDto {
  @ApiProperty({ description: 'Время окончания с клиента' })
  @IsISO8601()
  finishedAt: string;
}
