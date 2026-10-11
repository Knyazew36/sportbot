import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ nullable: true, type: String })
  email: string | null;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty({ nullable: true, type: String })
  name: string | null;

  @ApiProperty({ nullable: true, type: String })
  lastName: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Публичный URL аватара',
  })
  avatarUrl: string | null;

  @ApiProperty({ nullable: true, type: String })
  phone: string | null;

  @ApiProperty()
  isPlatformAdmin: boolean;

  @ApiProperty({ nullable: true, type: String })
  telegramId: string | null;

  @ApiProperty({ nullable: true, type: String })
  maxId: string | null;

  @ApiProperty({ nullable: true, type: String })
  vkId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
