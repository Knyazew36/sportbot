import { ApiProperty } from '@nestjs/swagger';

import { CooldownStretchResponseDto } from '@/workout/dto/cooldown-stretch.response.dto';

export class StretchRoutineResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ description: 'Виден пользователям' })
  published: boolean;

  @ApiProperty({ description: 'Всё вместе, мин (вверх до минуты)' })
  minutes: number;

  @ApiProperty({
    type: [CooldownStretchResponseDto],
    description: 'Растяжки по порядку',
  })
  stretches: CooldownStretchResponseDto[];
}
