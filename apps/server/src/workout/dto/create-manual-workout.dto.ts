import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Matches } from 'class-validator';

export class CreateManualWorkoutDto {
  @ApiProperty({ description: 'Комплекс своей программы' })
  @IsInt()
  complexId: number;

  @ApiProperty({
    example: '2026-10-20',
    description: 'День тренировки — сегодня или прошлый',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Дата в формате ГГГГ-ММ-ДД' })
  date: string;
}
