import { ApiProperty } from '@nestjs/swagger';

export class AdminExerciseResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, nullable: true })
  code: string | null;

  @ApiProperty({ type: String, nullable: true })
  technique: string | null;

  @ApiProperty({ type: [String] })
  steps: string[];

  @ApiProperty({ type: [String] })
  mistakes: string[];

  @ApiProperty({ type: String, nullable: true })
  videoUrl: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    enum: ['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT'],
  })
  equipment: 'BARBELL' | 'DUMBBELL' | 'MACHINE' | 'BODYWEIGHT' | null;

  @ApiProperty({ type: String, nullable: true })
  imagePath: string | null;

  @ApiProperty({ type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  imageEndPath: string | null;

  @ApiProperty({ type: String, nullable: true })
  imageEndUrl: string | null;

  @ApiProperty({ type: [Number] })
  primary: number[];

  @ApiProperty({ type: [Number] })
  secondary: number[];

  @ApiProperty({ type: [Number] })
  jointIds: number[];

  @ApiProperty({ enum: ['CATALOG', 'DRAFT'] })
  status: 'CATALOG' | 'DRAFT';
}
