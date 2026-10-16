import { ApiProperty } from '@nestjs/swagger';

export class ProgramAuthorResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, nullable: true })
  avatarUrl: string | null;
}
