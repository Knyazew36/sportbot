import { ApiProperty } from '@nestjs/swagger';

export class WorkoutAnalogResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Основные мышцы через « · »' })
  muscles: string;

  @ApiProperty({ type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty({ description: 'Личный черновик — «не проверено»' })
  draft: boolean;
}
