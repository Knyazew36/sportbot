import { ApiProperty } from '@nestjs/swagger';

export class StretchSessionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ type: Number, nullable: true })
  routineId: number | null;

  @ApiProperty({ description: 'Снимок названия комплекса' })
  routineName: string;

  @ApiProperty({ description: 'День занятия, YYYY-MM-DD' })
  date: string;

  @ApiProperty()
  startedAt: string;

  @ApiProperty({ type: String, nullable: true })
  finishedAt: string | null;
}
