import { ApiProperty } from '@nestjs/swagger';
import { OrgRole, Prisma } from '@/generated/prisma/client';

export class OrganizationMemberDto {
  @ApiProperty({ description: 'ID пользователя' })
  userId: number;

  @ApiProperty({
    type: String,
    description: 'Email пользователя; null, если смотрящему он не положен',
    nullable: true,
  })
  email: string | null;

  @ApiProperty({ type: String, description: 'Имя', nullable: true })
  name: string | null;

  @ApiProperty({ type: String, description: 'Фамилия', nullable: true })
  lastName: string | null;

  @ApiProperty({ type: String, description: 'URL аватарки', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ enum: OrgRole, description: 'Роль в организации' })
  role: OrgRole;

  @ApiProperty({ description: 'Когда выдана роль' })
  createdAt: Date;
}

export class OrganizationResponseDto {
  @ApiProperty({ description: 'ID организации' })
  id: number;

  @ApiProperty({ description: 'Название' })
  name: string;

  @ApiProperty({ description: 'false — организация удалена (мягко)' })
  active: boolean;

  @ApiProperty({
    type: Object,
    description: 'Произвольные настройки организации',
  })
  settings: Prisma.JsonValue;

  @ApiProperty({ description: 'ID пользователя-владельца' })
  ownerUserId: number;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата изменения' })
  updatedAt: Date;
}
