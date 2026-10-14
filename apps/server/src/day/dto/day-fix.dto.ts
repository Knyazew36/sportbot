import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class DayFixDto {
  @ApiProperty({
    enum: ['DONE', 'MISSED'],
    description: 'Какой должна быть отметка дня',
  })
  @IsIn(['DONE', 'MISSED'])
  status: 'DONE' | 'MISSED';
}
