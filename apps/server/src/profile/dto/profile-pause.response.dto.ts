import { ApiProperty } from '@nestjs/swagger';

export class ProfilePauseResponseDto {
  @ApiProperty({
    type: String,
    nullable: true,
    example: '2026-10-20',
    description: 'null — до отмены',
  })
  endDate: string | null;

  @ApiProperty({ description: 'Срок вышел — ждём «Возвращаемся?»' })
  expired: boolean;
}
