import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class SetTimezoneDto {
  @ApiPropertyOptional({
    example: 'Europe/Moscow',
    description: 'Пояс города из списка',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  zone?: string;

  @ApiPropertyOptional({
    example: '14:30',
    description: 'Или текущее время у пользователя',
  })
  @IsOptional()
  @Matches(/^([01]?\d|2[0-3]):[0-5]\d$/, { message: 'Время в формате ЧЧ:ММ' })
  localTime?: string;
}
