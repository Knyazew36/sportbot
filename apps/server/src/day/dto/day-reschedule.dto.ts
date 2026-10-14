import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class DayRescheduleDto {
  @ApiProperty({ description: 'Напомнить завтра: да или нет' })
  @IsBoolean()
  accept: boolean;
}
