import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator'

import { OrganizationSettingsDto } from './organization-settings.dto'

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ description: 'Название организации' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Название не короче 2 символов' })
  @MaxLength(200)
  name?: string

  @ApiPropertyOptional({
    description: 'true — открытая организация (вступить можно без приглашения), false — закрытая',
  })
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean

  @ApiPropertyOptional({
    type: OrganizationSettingsDto,
    description: 'Настройки кружка. При обновлении переданные ключи заменяют прежние, остальные сохраняются',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrganizationSettingsDto)
  settings?: OrganizationSettingsDto
}
