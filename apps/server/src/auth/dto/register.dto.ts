import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(254)
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов' })
  // Предел bcrypt — 72 байта, всё сверх молча обрезается
  @MaxLength(72)
  @Matches(/\S/, { message: 'Пароль не может состоять только из пробелов' })
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;
}
