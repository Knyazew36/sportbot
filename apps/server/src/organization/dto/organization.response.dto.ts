import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { OrgRole, Prisma } from '@/generated/prisma/client'

import { OrganizationSettingsDto } from './organization-settings.dto'

export class OrganizationMemberChildDto {
  @ApiProperty({ description: 'ID ребёнка (это тоже User)' })
  userId: number

  @ApiProperty({ type: String, description: 'Имя', nullable: true })
  name: string | null

  @ApiProperty({ type: String, description: 'Фамилия', nullable: true })
  lastName: string | null

  @ApiProperty({ type: Date, description: 'Дата рождения', nullable: true })
  birthDate: Date | null

  @ApiProperty({ type: String, description: 'URL аватарки', nullable: true })
  avatarUrl: string | null
}

export class OrganizationMemberDto {
  @ApiProperty({ description: 'ID пользователя' })
  userId: number

  @ApiProperty({ type: String, description: 'Email пользователя', nullable: true })
  email: string | null

  @ApiProperty({ type: String, description: 'Имя', nullable: true })
  name: string | null

  @ApiProperty({ type: String, description: 'Фамилия', nullable: true })
  lastName: string | null

  @ApiProperty({ type: String, description: 'URL аватарки', nullable: true })
  avatarUrl: string | null

  @ApiProperty({ enum: OrgRole, description: 'Роль в организации' })
  role: OrgRole

  @ApiProperty({ description: 'Когда выдана роль' })
  createdAt: Date

  @ApiPropertyOptional({
    type: [OrganizationMemberChildDto],
    description: 'Дети участника (только в списке состава)',
  })
  children?: OrganizationMemberChildDto[]
}

export class OrganizationResponseDto {
  @ApiProperty({ description: 'ID учреждения' })
  id: number

  @ApiProperty({ description: 'Название' })
  name: string

  @ApiProperty({ description: 'Активно ли учреждение' })
  active: boolean

  @ApiProperty({ description: 'true — открытая организация (вступить можно без приглашения)' })
  isOpen: boolean

  @ApiProperty({ type: OrganizationSettingsDto, description: 'Настройки кружка' })
  settings: Prisma.JsonValue

  @ApiProperty({ description: 'ID пользователя-владельца' })
  ownerUserId: number

  @ApiProperty({ type: Date, description: 'Конец пробного периода; null — ограничения нет', nullable: true })
  trialEndsAt: Date | null

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date

  @ApiProperty({ description: 'Дата изменения' })
  updatedAt: Date
}
