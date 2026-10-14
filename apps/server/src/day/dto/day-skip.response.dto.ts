import { ApiProperty } from '@nestjs/swagger';

export class DaySkipResponseDto {
  @ApiProperty({ description: 'Предложить «напомнить завтра»' })
  canReschedule: boolean;

  @ApiProperty({ description: 'Три пропуска подряд — предложить паузу' })
  suggestPause: boolean;
}
