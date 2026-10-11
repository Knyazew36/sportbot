import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @ApiProperty({ description: 'Email, на который повторно отправить код' })
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;
}
