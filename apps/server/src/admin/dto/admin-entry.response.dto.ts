import { ApiProperty } from '@nestjs/swagger';

/** Запись из заявки: черновик упражнения или растяжки. */
export class AdminEntryResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Общее описание',
  })
  text: string | null;

  @ApiProperty({ type: [String] })
  steps: string[];

  @ApiProperty({ type: [String] })
  mistakes: string[];

  @ApiProperty({ type: String, nullable: true })
  videoUrl: string | null;

  @ApiProperty({ type: [String] })
  primaryMuscles: string[];

  @ApiProperty({ type: [String] })
  secondaryMuscles: string[];

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Растяжка: удержание, с',
  })
  holdSeconds: number | null;

  @ApiProperty({ type: Boolean, nullable: true })
  perSide: boolean | null;
}
