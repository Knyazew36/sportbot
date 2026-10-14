import { ApiProperty } from '@nestjs/swagger';

/** Строка админского списка справочника. */
export class AdminCatalogItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, nullable: true })
  code: string | null;

  @ApiProperty({ type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty({ description: 'Мышц отмечено' })
  muscleCount: number;

  @ApiProperty({ enum: ['CATALOG', 'DRAFT'] })
  status: 'CATALOG' | 'DRAFT';
}
