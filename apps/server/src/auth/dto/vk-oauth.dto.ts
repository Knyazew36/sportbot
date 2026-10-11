import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, MinLength } from 'class-validator'

export class VkOAuthDto {
  @ApiProperty({ description: 'Authorization code из редиректа VK ID' })
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  code: string

  @ApiProperty({ description: 'code_verifier (PKCE), сгенерированный на клиенте перед редиректом' })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  codeVerifier: string

  @ApiProperty({ description: 'device_id, который VK ID вернул вместе с code в query редиректа' })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  deviceId: string

  @ApiProperty({ description: 'state, сгенерированный на клиенте перед редиректом' })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  state: string

  @ApiProperty({ description: 'redirect_uri, использованный при редиректе на VK ID (должен совпадать 1-в-1)' })
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  redirectUri: string
}
