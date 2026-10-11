import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({ description: 'Email созданного аккаунта' })
  email: string;

  @ApiProperty({ description: 'Человекочитаемый статус операции' })
  message: string;

  @ApiProperty({
    description:
      'false — аккаунт создан, но письмо с кодом не ушло (сбой почтового провайдера); нужно запросить код повторно',
  })
  emailSent: boolean;
}
