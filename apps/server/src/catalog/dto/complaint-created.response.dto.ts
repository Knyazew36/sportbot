import { ApiProperty } from '@nestjs/swagger';

export class ComplaintCreatedResponseDto {
  @ApiProperty()
  id: number;
}
