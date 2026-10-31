import { ApiProperty } from '@nestjs/swagger';

export class WorkoutTonnageRecordResponseDto {
  @ApiProperty({ description: 'Прежний лучший тоннаж одной тренировки, кг' })
  previous: number;
}
