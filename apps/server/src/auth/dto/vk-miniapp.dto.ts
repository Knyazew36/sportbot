import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator'

import { VkMiniAppProfileDto } from './vk-miniapp-profile.dto'

export class VkMiniAppDto {
  @ApiProperty({
    description:
      'Строка launch-параметров VK Mini App (window.location.search), включая vk_* и sign',
    example: 'vk_user_id=123&vk_app_id=456&vk_ts=1710000000&sign=xxxxx',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  launchParams: string

  @ApiPropertyOptional({
    type: VkMiniAppProfileDto,
    description:
      'Профиль из VK Bridge (VKWebAppGetUserInfo) — в launch-параметрах его нет, бэк складывает в vkData',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VkMiniAppProfileDto)
  profile?: VkMiniAppProfileDto
}
