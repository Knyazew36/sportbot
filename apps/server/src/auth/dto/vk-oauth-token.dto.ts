import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, MinLength } from 'class-validator'

export class VkOAuthTokenDto {
  @ApiProperty({
    description: 'access_token VK ID, уже полученный на клиенте через VKID.Auth.exchangeCode (SDK-виджет)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  accessToken: string
}
