import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator'

/**
 * Профиль из VK Bridge (VKWebAppGetUserInfo) — launch-параметры имени/фото не несут,
 * фронт запрашивает их отдельно и присылает сюда. Все поля опциональны: вне клиента VK
 * бридж недоступен, вход должен проходить и без них.
 */
export class VkMiniAppProfileDto {
  @ApiPropertyOptional({ description: 'Имя из VK-профиля', example: 'Иван' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  firstName?: string

  @ApiPropertyOptional({ description: 'Фамилия из VK-профиля', example: 'Иванов' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  lastName?: string

  @ApiPropertyOptional({
    description: 'URL фото из VK-профиля (photo_200)',
    example: 'https://sun1.vk.me/photo_200.jpg',
  })
  // VK Bridge иногда отдаёт photo_200 пустой строкой (нет фото/сбой бриджа) — @IsOptional()
  // пропускает только null/undefined, поэтому пустую строку превращаем в undefined сами,
  // иначе @IsUrl() валит весь запрос 400-й.
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  avatarUrl?: string
}
