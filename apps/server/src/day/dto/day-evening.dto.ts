import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class DayEveningDto {
  @ApiProperty({ description: 'Потренировался сегодня?' })
  @IsBoolean()
  yes: boolean;
}
