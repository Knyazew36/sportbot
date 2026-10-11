import { ApiProperty } from '@nestjs/swagger';

import { JoinRequestStatus } from '@/generated/prisma/client';

export class JoinRequestResponseDto {
  @ApiProperty({ description: 'ID заявки' })
  id: number;

  @ApiProperty({ description: 'ID организации' })
  organizationId: number;

  @ApiProperty({ description: 'Название организации' })
  organizationName: string;

  @ApiProperty({ description: 'ID заявителя (User)' })
  userId: number;

  @ApiProperty({ type: String, description: 'Email заявителя', nullable: true })
  email: string | null;

  @ApiProperty({ type: String, description: 'Имя заявителя', nullable: true })
  name: string | null;

  @ApiProperty({
    type: String,
    description: 'Фамилия заявителя',
    nullable: true,
  })
  lastName: string | null;

  @ApiProperty({
    type: String,
    description: 'Аватар заявителя',
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({
    type: String,
    description: 'Телефон заявителя',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    type: Number,
    description: 'ID приглашения, по которому подана заявка',
    nullable: true,
  })
  inviteId: number | null;

  @ApiProperty({ description: 'Статус заявки', enum: JoinRequestStatus })
  status: JoinRequestStatus;

  @ApiProperty({ description: 'Дата подачи заявки' })
  createdAt: Date;

  @ApiProperty({
    type: Date,
    description: 'Дата решения (approve/reject/cancel)',
    nullable: true,
  })
  decidedAt: Date | null;
}
