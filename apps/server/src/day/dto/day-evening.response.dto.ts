import { ApiProperty } from '@nestjs/swagger';

export class DayEveningResponseDto {
  @ApiProperty({ description: 'Тренировка засчитана' })
  done: boolean;

  @ApiProperty({ description: 'Серия после ответа' })
  currentStreak: number;

  @ApiProperty({ description: 'При «нет»: предложить «напомнить завтра»' })
  canReschedule: boolean;

  @ApiProperty({ description: 'При «нет»: предложить паузу' })
  suggestPause: boolean;
}
