import { ApiProperty } from '@nestjs/swagger';

export class WorkoutRecordResponseDto {
  @ApiProperty()
  exerciseId: number;

  @ApiProperty()
  name: string;

  @ApiProperty({
    enum: ['kg', 'reps'],
    enumName: 'RecordUnit',
    description: 'В чём рекорд: вес или, у упражнений без веса, повторы',
  })
  unit: 'kg' | 'reps';

  @ApiProperty({ description: 'Лучший подход сегодня' })
  value: number;

  @ApiProperty({ description: 'Прежний лучший' })
  previous: number;
}
