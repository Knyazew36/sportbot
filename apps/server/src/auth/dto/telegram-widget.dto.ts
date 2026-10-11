import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

/** Поля в точности как их присылает Telegram Login Widget — переименовывать нельзя, они участвуют в проверке подписи. */
export class TelegramWidgetAuthDto {
  @ApiProperty({ description: 'Telegram user id' })
  @IsInt()
  id: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  first_name?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  last_name?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  username?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  photo_url?: string

  @ApiProperty({ description: 'Unix-время подписи виджета' })
  @IsInt()
  auth_date: number

  @ApiProperty({ description: 'HMAC-SHA256 подпись от Telegram' })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  hash: string
}
