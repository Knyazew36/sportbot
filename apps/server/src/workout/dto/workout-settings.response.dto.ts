import { ApiProperty } from '@nestjs/swagger';

export class WorkoutSettingsResponseDto {
  @ApiProperty({
    description:
      'Показывать таймер отдыха; выключен — внизу только ввод подхода',
  })
  showRestTimer: boolean;

  @ApiProperty({ description: 'Отдых между подходами, с' })
  restSeconds: number;

  @ApiProperty({ description: 'Таймер отдыха стартует сам после подхода' })
  restAutoStart: boolean;

  @ApiProperty({ description: 'Звук по окончании таймеров' })
  timerSound: boolean;

  @ApiProperty({ description: 'Вибрация по окончании таймеров' })
  timerVibration: boolean;
}
