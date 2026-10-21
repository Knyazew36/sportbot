import { ApiProperty } from '@nestjs/swagger';

export class StretchExclusionResponseDto {
  @ApiProperty()
  stretchId: number;

  @ApiProperty({ example: 'Растяжка грудных у стены' })
  name: string;

  @ApiProperty({ type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty({ example: 'Грудные · Передние дельты' })
  muscles: string;

  @ApiProperty({ example: '2026-10-21T12:00:00.000Z' })
  createdAt: string;
}
