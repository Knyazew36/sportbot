import { ApiProperty } from '@nestjs/swagger';

export class AdminUserResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  displayName: string;

  @ApiProperty({ type: String, nullable: true })
  telegramId: string | null;

  @ApiProperty({ type: String, nullable: true })
  maxId: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: '@ник в мессенджере',
  })
  username: string | null;

  @ApiProperty()
  blocked: boolean;

  @ApiProperty({ description: 'Первый запуск пройден' })
  onboarded: boolean;

  @ApiProperty()
  isAdmin: boolean;

  @ApiProperty()
  createdAt: Date;
}
