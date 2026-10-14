import { ApiProperty } from '@nestjs/swagger';

export class FriendProgramResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  complexCount: number;

  @ApiProperty({ description: 'Активная программа друга' })
  active: boolean;
}
