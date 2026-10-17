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

  @ApiProperty({
    type: Date,
    nullable: true,
    description: 'Когда записан; null — подход до учёта времени',
  })
  doneAt: Date | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Чистое время подхода, с; null — ручной ввод или бот',
  })
  workSeconds: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'План отдыха перед подходом, с',
  })
  restTargetSeconds: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Фактический отдых перед подходом, с; null — первый, после перехода, простоя или без времени',
  })
  restBeforeSeconds: number | null;
}
