import { ApiProperty } from '@nestjs/swagger';

import { OrgRole } from '@/generated/prisma/client';

export class InviteResponseDto {
  @ApiProperty({ description: 'ID приглашения' })
  id: number;

  @ApiProperty({ description: 'ID организации' })
  organizationId: number;

  @ApiProperty({ description: 'Длинный токен для ссылки' })
  token: string;

  @ApiProperty({ description: 'ID автора приглашения' })
  createdByUserId: number;

  @ApiProperty({
    type: Date,
    description: 'Срок действия (null — бессрочно)',
    nullable: true,
  })
  expiresAt: Date | null;

  @ApiProperty({ description: 'Сколько раз по приглашению подключились' })
  usedCount: number;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;
}

export class RedeemPreviewDto {
  @ApiProperty({ description: 'ID организации' })
  organizationId: number;

  @ApiProperty({ description: 'Название организации' })
  organizationName: string;

  @ApiProperty({ description: 'Имя владельца организации' })
  ownerName: string;

  @ApiProperty({
    type: String,
    description: 'Аватар владельца организации',
    nullable: true,
  })
  ownerAvatarUrl: string | null;
}

export class RedeemResultDto {
  @ApiProperty({
    description:
      'ID организации, в которую подана заявка / в которой уже состоит пользователь',
  })
  organizationId: number;

  @ApiProperty({
    description: 'true — пользователь уже был участником этой организации',
  })
  alreadyMember: boolean;

  @ApiProperty({
    description:
      'true — заявка создана (или уже была) и ждёт решения владельца',
  })
  pending: boolean;

  @ApiProperty({
    description: 'Роль пользователя в организации, если уже участник',
    enum: OrgRole,
    nullable: true,
  })
  role: OrgRole | null;

  @ApiProperty({
    type: Number,
    description: 'ID заявки, если pending=true',
    nullable: true,
  })
  joinRequestId: number | null;
}
