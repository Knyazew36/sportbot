import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TelegramLoginStatusQueryDto {
  @ApiProperty({
    description: 'Токен из ответа POST auth/telegram-login/start',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
