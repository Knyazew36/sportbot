import { ApiProperty } from '@nestjs/swagger';

export class AdminComplaintResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  text: string;

  @ApiProperty({ enum: ['OPEN', 'RESOLVED', 'REJECTED'] })
  status: 'OPEN' | 'RESOLVED' | 'REJECTED';

  @ApiProperty({ enum: ['exercise', 'stretch'] })
  kind: 'exercise' | 'stretch';

  @ApiProperty({ type: Number, nullable: true })
  entryId: number | null;

  @ApiProperty()
  entryName: string;

  @ApiProperty({ type: String, nullable: true })
  author: string | null;

  @ApiProperty()
  createdAt: Date;
}
