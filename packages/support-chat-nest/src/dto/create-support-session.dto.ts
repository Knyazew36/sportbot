import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator'

import { trimToUndefined } from './transforms'

export class CreateSupportSessionDto {
  @ApiPropertyOptional({ description: 'Ключ анонимного посетителя из прошлого входа' })
  @IsOptional()
  @IsUUID()
  public anonymousKey?: string

  @ApiPropertyOptional({ description: 'id пользователя внешнего сайта (вместе с userHash)' })
  @Transform(trimToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(128)
  public userId?: string

  @ApiPropertyOptional({ description: 'hex(HMAC-SHA256(identitySecret, userId)), считается на бэке сайта' })
  @IsOptional()
  @Matches(/^[0-9a-fA-F]{64}$/, { message: 'userHash — 64 hex-символа' })
  public userHash?: string

  @ApiPropertyOptional()
  @Transform(trimToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  public name?: string

  @ApiPropertyOptional()
  @Transform(trimToUndefined)
  @IsOptional()
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(254)
  public email?: string

  @ApiPropertyOptional()
  @Transform(trimToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(32)
  public phone?: string
}
