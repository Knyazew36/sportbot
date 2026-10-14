import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export class OnboardingTimesDto {
  @ApiProperty({ example: '08:00', description: 'Утренний вопрос, HH:mm' })
  @Matches(TIME, { message: 'Время в формате ЧЧ:ММ' })
  morningTime: string;

  @ApiProperty({ example: '20:00', description: 'Вечерний вопрос, HH:mm' })
  @Matches(TIME, { message: 'Время в формате ЧЧ:ММ' })
  eveningTime: string;
}
