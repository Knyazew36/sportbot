import { ApiProperty } from '@nestjs/swagger';

import { ProgramComplexResponseDto } from '@/program/dto/program-complex.response.dto';

export class FriendProgramResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  complexCount: number;

  @ApiProperty({ description: 'Активная программа друга' })
  active: boolean;

  @ApiProperty({
    type: [ProgramComplexResponseDto],
    description: 'Состав программы для просмотра перед копированием',
  })
  complexes: ProgramComplexResponseDto[];
}
