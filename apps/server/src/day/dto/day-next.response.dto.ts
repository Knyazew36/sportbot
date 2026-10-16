import { ApiProperty } from '@nestjs/swagger';

export class DayNextResponseDto {
  @ApiProperty({
    type: String,
    nullable: true,
    example: '2026-10-16',
    description:
      'Ближайший тренировочный день после сегодня; null — пауза до отмены или расписание пустое',
  })
  date: string | null;

  @ApiProperty({ description: 'Комплекс, следующий по очереди' })
  complexId: number;

  @ApiProperty()
  complexName: string;

  @ApiProperty()
  exerciseCount: number;
}
