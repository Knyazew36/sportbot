import { ApiProperty } from '@nestjs/swagger';

export class ChildResponseDto {
  @ApiProperty({ description: 'ID ребёнка (это тоже User)' })
  id: number;

  @ApiProperty({ type: String, description: 'Имя', nullable: true })
  name: string | null;

  @ApiProperty({ type: String, description: 'Фамилия', nullable: true })
  lastName: string | null;

  @ApiProperty({ type: String, format: 'date-time', description: 'Дата рождения', nullable: true })
  birthDate: Date | null;

  @ApiProperty({ type: String, description: 'URL аватарки', nullable: true })
  avatarUrl: string | null;
}
