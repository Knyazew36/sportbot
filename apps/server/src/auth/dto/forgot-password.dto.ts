import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Email аккаунта' })
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;
}
