import { ApiProperty } from '@nestjs/swagger';

export class BodyWeightResponseDto {
  @ApiProperty({ example: '2026-10-14' })
  date: string;

  @ApiProperty()
  value: number;
}
