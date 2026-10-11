import { ApiProperty } from '@nestjs/swagger';

export class ChatSubmissionDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: String, nullable: true })
  phone: string | null;

  @ApiProperty({ type: String, nullable: true })
  email: string | null;

  @ApiProperty({ type: [String], description: 'Публичные URL картинок' })
  fileUrls: string[];

  @ApiProperty()
  createdAt: Date;
}
