import { ApiProperty } from '@nestjs/swagger';

export class WorkoutSetResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ description: 'Номер подхода в упражнении, с 1' })
  number: number;

  @ApiProperty({ description: 'Вес, кг; 0 — без веса' })
  weight: number;

  @ApiProperty()
  reps: number;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'uuid с клиента; null — подход записан не из офлайн-очереди',
  })
  clientId: string | null;
}
