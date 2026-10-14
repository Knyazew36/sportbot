import { ApiProperty } from '@nestjs/swagger';

export class StatsMuscleLoadResponseDto {
  @ApiProperty()
  muscleId: number;

  @ApiProperty()
  name: string;

  @ApiProperty({
    description: 'Подходы за неделю: основная мышца 1, вспомогательная 0,5',
  })
  sets: number;

  @ApiProperty({ description: 'Ноль подходов за последние 2 недели' })
  forgotten: boolean;
}
