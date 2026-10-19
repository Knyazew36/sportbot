import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Имя для друзей' })
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1, { message: 'Имя не может быть пустым' })
  @MaxLength(64, { message: 'Имя — до 64 символов' })
  displayName?: string;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE'], description: 'Пол' })
  @IsOptional()
  @IsIn(['MALE', 'FEMALE'], { message: 'Выбери пол' })
  gender?: 'MALE' | 'FEMALE';

  @ApiPropertyOptional({ type: [Number], description: '0..6, 0 — воскресенье' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Выбери хотя бы один день' })
  @ArrayMaxSize(7)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  trainingDays?: number[];

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @Matches(TIME, { message: 'Время в формате ЧЧ:ММ' })
  morningTime?: string;

  @ApiPropertyOptional({ example: '20:00' })
  @IsOptional()
  @Matches(TIME, { message: 'Время в формате ЧЧ:ММ' })
  eveningTime?: string;

  @ApiPropertyOptional({
    description: 'Повторять вопрос без ответа: утренний через 2 часа, вечерний наутро',
  })
  @IsOptional()
  @IsBoolean()
  remindersEnabled?: boolean;

  @ApiPropertyOptional({ enum: ['OFF', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'] })
  @IsOptional()
  @IsIn(['OFF', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'])
  weightAskFrequency?: 'OFF' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

  @ApiPropertyOptional({ description: 'Показывать таймер отдыха' })
  @IsOptional()
  @IsBoolean()
  showRestTimer?: boolean;

  @ApiPropertyOptional({ description: 'Отдых между подходами, с' })
  @IsOptional()
  @IsInt()
  @Min(15, { message: 'Отдых — от 15 секунд' })
  @Max(600, { message: 'Отдых — до 10 минут' })
  restSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  restAutoStart?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  timerSound?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  timerVibration?: boolean;
}
