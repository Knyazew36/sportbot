import { ApiProperty } from '@nestjs/swagger';

/** Строка выдачи справочника: упражнение или растяжка. */
export class CatalogListItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Основные мышцы (у растяжки — все) через « · »' })
  muscles: string;

  @ApiProperty({ type: String, nullable: true, description: '/uploads/…' })
  imageUrl: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    enum: ['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT'],
    description: 'Инвентарь; у растяжек null',
  })
  equipment: 'BARBELL' | 'DUMBBELL' | 'MACHINE' | 'BODYWEIGHT' | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Растяжка: удержание, с',
  })
  holdSeconds: number | null;

  @ApiProperty({ description: 'Личный черновик — «не проверено»' })
  draft: boolean;
}
