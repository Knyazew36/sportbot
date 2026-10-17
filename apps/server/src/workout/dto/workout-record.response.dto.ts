import { ApiProperty } from '@nestjs/swagger';

export class WorkoutRecordResponseDto {
  @ApiProperty()
  exerciseId: number;

  @ApiProperty()
  name: string;

  @ApiProperty({
    enum: ['kg', 'reps', 'sec', 'min'],
    enumName: 'RecordUnit',
    description:
      'В чём рекорд: вес или, у упражнений без веса, повторы; у удержаний — секунды, у кардио — минуты',
  })
  unit: 'kg' | 'reps' | 'sec' | 'min';

  @ApiProperty({ description: 'Лучший подход сегодня' })
  value: number;

  @ApiProperty({ description: 'Прежний лучший' })
  previous: number;
}
