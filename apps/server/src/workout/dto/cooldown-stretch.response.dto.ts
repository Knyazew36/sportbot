import { ApiProperty } from '@nestjs/swagger';

export class CooldownStretchResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, nullable: true, description: 'Общее описание' })
  howTo: string | null;

  @ApiProperty({ type: [String], description: 'Шаги выполнения по порядку' })
  steps: string[];

  @ApiProperty({
    type: [String],
    description: 'Типичные ошибки, каждая с исправлением',
  })
  mistakes: string[];

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Фото финишного положения',
  })
  imageEndUrl: string | null;

  @ApiProperty({ type: String, nullable: true, description: '/uploads/…' })
  imageUrl: string | null;

  @ApiProperty({ description: 'Удержание, с' })
  holdSeconds: number;

  @ApiProperty({ description: 'На каждую сторону: два круга подряд' })
  perSide: boolean;

  @ApiProperty({ description: 'Какие мышцы тянет, через « · »' })
  muscles: string;
}
