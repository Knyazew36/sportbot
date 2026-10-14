import { ApiProperty } from '@nestjs/swagger';

export class DayComplexBriefResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  exerciseCount: number;

  @ApiProperty({ description: 'Следующий по очереди' })
  isNext: boolean;
}
