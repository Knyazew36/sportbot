import { ApiProperty } from '@nestjs/swagger';

export class StatsMuscleLoadResponseDto {
  @ApiProperty()
  muscleId: number;

  @ApiProperty()
  name: string;

  @ApiProperty({
    description: 'Подходов в неделю в среднем за период: основная мышца 1, вспомогательная 0,5',
  })
  sets: number;

  @ApiProperty({ description: 'Ноль подходов за период' })
  forgotten: boolean;
}
