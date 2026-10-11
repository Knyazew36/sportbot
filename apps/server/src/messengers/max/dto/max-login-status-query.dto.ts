import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MaxLoginStatusQueryDto {
  @ApiProperty({ description: 'Токен из ответа POST auth/max-login/start' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
