import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, Matches } from 'class-validator';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export class OnboardingTimesDto {
  @ApiProperty({ example: '08:00', description: 'Утренний вопрос, HH:mm' })
  @Matches(TIME, { message: 'Время в формате ЧЧ:ММ' })
  morningTime: string;

  @ApiProperty({ example: '20:00', description: 'Вечерний вопрос, HH:mm' })
  @Matches(TIME, { message: 'Время в формате ЧЧ:ММ' })
  eveningTime: string;

  // Необязательно: открытая до обновления Mini App шлёт только время
  @ApiPropertyOptional({
    description: 'Повторять вопрос без ответа: утренний через 2 часа, вечерний наутро',
  })
  @IsOptional()
  @IsBoolean()
  remindersEnabled?: boolean;
}
