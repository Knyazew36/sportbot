import { ApiProperty } from '@nestjs/swagger';

import { CooldownStretchResponseDto } from './cooldown-stretch.response.dto';

export class CooldownResponseDto {
  @ApiProperty()
  workoutId: number;

  @ApiProperty({ description: 'Всё вместе, мин (вверх до минуты)' })
  minutes: number;

  @ApiProperty({ description: 'Блок «если есть время», мин' })
  optionalMinutes: number;

  @ApiProperty({
    description: 'Звук и вибрация по окончании удержания (настройка профиля)',
  })
  timerSound: boolean;

  @ApiProperty({
    type: [CooldownStretchResponseDto],
    description: 'Основной блок',
  })
  main: CooldownStretchResponseDto[];

  @ApiProperty({
    type: [CooldownStretchResponseDto],
    description: 'Если есть время',
  })
  optional: CooldownStretchResponseDto[];
}
