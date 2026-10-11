import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Email аккаунта' })
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @ApiProperty({ description: '6-значный код из письма', example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Код должен состоять из 6 цифр' })
  @Matches(/^\d{6}$/, { message: 'Код должен состоять из 6 цифр' })
  code: string;

  @ApiProperty({ description: 'Новый пароль (8–72 символа)' })
  @IsString()
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов' })
  @MaxLength(72)
  @Matches(/\S/, { message: 'Пароль не может состоять только из пробелов' })
  newPassword: string;
}
