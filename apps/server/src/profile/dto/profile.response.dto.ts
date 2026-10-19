import { ApiProperty } from '@nestjs/swagger';

import { ProfilePauseResponseDto } from './profile-pause.response.dto';

export class ProfileResponseDto {
  @ApiProperty()
  displayName: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Фото профиля; null — показываем инициалы',
  })
  avatarUrl: string | null;

  @ApiProperty({
    enum: ['MALE', 'FEMALE'],
    nullable: true,
    description: 'Пол; null — не выбран',
  })
  gender: 'MALE' | 'FEMALE' | null;

  @ApiProperty({ example: 'Europe/Moscow' })
  timeZone: string;

  @ApiProperty({ example: 'Москва', description: 'Город или UTC±N' })
  timeZoneTitle: string;

  @ApiProperty({ type: [Number], description: '0..6, 0 — воскресенье' })
  trainingDays: number[];

  @ApiProperty({ example: '08:00' })
  morningTime: string;

  @ApiProperty({ example: '20:00' })
  eveningTime: string;

  @ApiProperty({
    description: 'Повторять вопрос без ответа: утренний через 2 часа, вечерний наутро',
  })
  remindersEnabled: boolean;

  @ApiProperty({ enum: ['OFF', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'] })
  weightAskFrequency: 'OFF' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

  @ApiProperty({ description: 'Показывать таймер отдыха на экране тренировки' })
  showRestTimer: boolean;

  @ApiProperty({ description: 'Отдых между подходами, с' })
  restSeconds: number;

  @ApiProperty()
  restAutoStart: boolean;

  @ApiProperty({ description: 'Звук по окончании таймеров' })
  timerSound: boolean;

  @ApiProperty({ description: 'Вибрация по окончании таймеров' })
  timerVibration: boolean;

  @ApiProperty({ type: ProfilePauseResponseDto, nullable: true })
  pause: ProfilePauseResponseDto | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Последний записанный вес тела',
  })
  lastBodyWeight: number | null;
}
