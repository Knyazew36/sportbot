import { ApiProperty } from '@nestjs/swagger';

export class AdminSimilarResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}
