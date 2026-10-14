import { ApiProperty } from '@nestjs/swagger';

export class PauseResponseDto {
  @ApiProperty({ example: '2026-10-14' })
  startDate: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'null — до отмены',
  })
  endDate: string | null;
}
