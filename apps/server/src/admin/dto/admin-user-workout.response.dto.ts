import { ApiProperty } from '@nestjs/swagger';

export class AdminUserWorkoutResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  complexName: string;

  @ApiProperty({ description: 'День тренировки, YYYY-MM-DD' })
  date: string;

  @ApiProperty({ enum: ['IN_PROGRESS', 'FINISHED', 'AUTO_CLOSED'] })
  status: 'IN_PROGRESS' | 'FINISHED' | 'AUTO_CLOSED';

  @ApiProperty({ enum: ['SIMPLE', 'DETAILED'] })
  mode: 'SIMPLE' | 'DETAILED';

  @ApiProperty({ description: 'Начата не в тренировочный день' })
  unplanned: boolean;

  @ApiProperty()
  startedAt: Date;

  @ApiProperty({ type: Date, nullable: true })
  finishedAt: Date | null;

  @ApiProperty({ description: 'Записано подходов' })
  sets: number;
}
