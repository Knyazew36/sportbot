import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VkLoginStatusQueryDto {
  @ApiProperty({ description: 'Токен из ответа POST auth/vk-login/start' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
