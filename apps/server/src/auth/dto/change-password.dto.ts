import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiPropertyOptional({
    description: 'Текущий пароль (обязателен, если он уже задан)',
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({ description: 'Новый пароль (8–72 символа)' })
  @IsString()
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов' })
  @MaxLength(72)
  @Matches(/\S/, { message: 'Пароль не может состоять только из пробелов' })
  newPassword: string;
}
