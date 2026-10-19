import { ApiProperty } from '@nestjs/swagger';

export class WorkoutTimingResponseDto {
  @ApiProperty({ description: 'Разминка: от старта до начала первого подхода, с' })
  warmupSeconds: number;

  @ApiProperty({ description: 'Чистая работа по секундомеру, с' })
  workSeconds: number;

  @ApiProperty({ description: 'Отдых: всё время между подходами, включая ввод результата и смену упражнения, с' })
  restSeconds: number;

  @ApiProperty({ description: 'Пауз отдыха, по ним средний отдых' })
  restCount: number;

  @ApiProperty({
    description: 'План отдыха у тех пауз, где таймер запускали, с',
  })
  restTargetSeconds: number;

  @ApiProperty({
    description: 'Факт отдыха у тех же пауз — чтобы сравнить с планом, с',
  })
  restPlannedActualSeconds: number;

  @ApiProperty({ description: 'От последнего подхода до завершения, с' })
  tailSeconds: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Заминка, с; null — не проходили',
  })
  cooldownSeconds: number | null;
}
