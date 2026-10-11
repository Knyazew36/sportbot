import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { IsPhoneOrEmailPresent } from '@/common';

export class CreateChatSubmissionDto {
  @ApiProperty({ description: 'Текст сообщения' })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message: string;

  @ApiProperty({
    required: false,
    description: 'Телефон (обязателен, если не указан email)',
  })
  // Не @IsOptional: тогда при пустых phone и email проверка «хотя бы один контакт» не запустится.
  @ValidateIf((o: CreateChatSubmissionDto) => Boolean(o.phone) || !o.email)
  @IsPhoneOrEmailPresent({ message: 'Укажите телефон или email' })
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{5,20}$/, {
    message: 'Некорректный формат телефона',
  })
  phone?: string;

  @ApiProperty({
    required: false,
    description: 'Email (обязателен, если не указан телефон)',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Некорректный формат email' })
  email?: string;
}
