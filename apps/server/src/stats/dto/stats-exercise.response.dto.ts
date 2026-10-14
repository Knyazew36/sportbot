import { ApiProperty } from '@nestjs/swagger';

export class StatsExerciseResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}
