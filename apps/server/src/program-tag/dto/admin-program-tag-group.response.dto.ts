import { ApiProperty } from '@nestjs/swagger';

import { AdminProgramTagResponseDto } from './admin-program-tag.response.dto';

export class AdminProgramTagGroupResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'place' })
  code: string;

  @ApiProperty({ example: 'Где занимаешься' })
  name: string;

  @ApiProperty()
  position: number;

  @ApiProperty({
    type: [AdminProgramTagResponseDto],
    description: 'Все теги группы по порядку',
  })
  tags: AdminProgramTagResponseDto[];
}
