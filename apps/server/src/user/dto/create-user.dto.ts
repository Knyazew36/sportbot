import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiPropertyOptional({
    description: 'Email (уникальный). Пароль пользователь задаёт сам позже',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ description: 'Имя' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Фамилия' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Телефон (опционально)' })
  @IsOptional()
  @IsString()
  @Matches(/^[+\d][\d\s()-]{9,}$/, { message: 'Некорректный телефон' })
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Сделать платформенным администратором',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPlatformAdmin?: boolean;
}
