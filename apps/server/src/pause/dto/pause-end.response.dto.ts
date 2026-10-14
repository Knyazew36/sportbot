import { ApiProperty } from '@nestjs/swagger';

export class PauseEndResponseDto {
  @ApiProperty({ description: 'Была действующая пауза и она снята' })
  ended: boolean;
}
