import { ApiProperty } from '@nestjs/swagger';

export class StatsSessionSetResponseDto {
  @ApiProperty({ description: 'Вес, кг; 0 — без веса' })
  weight: number;

  @ApiProperty()
  reps: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Отдых перед подходом, с; null — первый, ручной или без времени',
  })
  restBeforeSeconds: number | null;
}
