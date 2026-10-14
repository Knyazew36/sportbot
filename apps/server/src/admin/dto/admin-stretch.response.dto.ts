import { ApiProperty } from '@nestjs/swagger';

export class AdminStretchResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, nullable: true })
  code: string | null;

  @ApiProperty({ type: String, nullable: true })
  howTo: string | null;

  @ApiProperty()
  holdSeconds: number;

  @ApiProperty()
  perSide: boolean;

  @ApiProperty({ enum: ['COOLDOWN', 'WARMUP'] })
  kind: 'COOLDOWN' | 'WARMUP';

  @ApiProperty({ type: String, nullable: true })
  imagePath: string | null;

  @ApiProperty({ type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty({ type: [Number] })
  muscles: number[];

  @ApiProperty({ enum: ['CATALOG', 'DRAFT'] })
  status: 'CATALOG' | 'DRAFT';
}
