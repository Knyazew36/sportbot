import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Email аккаунта' })
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @ApiProperty({ description: '6-значный код из письма', example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Код должен состоять из 6 цифр' })
  @Matches(/^\d{6}$/, { message: 'Код должен состоять из 6 цифр' })
  code: string;
}
