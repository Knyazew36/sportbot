import { ApiProperty } from '@nestjs/swagger';

import { WorkoutItemResponseDto } from './workout-item.response.dto';
import { WorkoutSettingsResponseDto } from './workout-settings.response.dto';

export class WorkoutResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ type: Number, nullable: true })
  complexId: number | null;

  @ApiProperty()
  complexName: string;

  @ApiProperty({ enum: ['IN_PROGRESS', 'FINISHED', 'AUTO_CLOSED'] })
  status: 'IN_PROGRESS' | 'FINISHED' | 'AUTO_CLOSED';

  @ApiProperty({ example: '2026-10-14' })
  date: string;

  @ApiProperty()
  startedAt: Date;

  @ApiProperty({ type: Date, nullable: true })
  finishedAt: Date | null;

  @ApiProperty({ type: String, nullable: true })
  cardioName: string | null;

  @ApiProperty({ type: Number, nullable: true })
  cardioMinutes: number | null;

  @ApiProperty({ type: [WorkoutItemResponseDto] })
  exercises: WorkoutItemResponseDto[];

  @ApiProperty({
    type: WorkoutSettingsResponseDto,
    description: 'Таймеры из профиля',
  })
  settings: WorkoutSettingsResponseDto;
}
