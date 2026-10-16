import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UngroupSupersetDto {
  @ApiProperty({ description: 'Номер суперсета в комплексе', example: 1 })
  @IsInt()
  @Min(1)
  superset: number;
}
