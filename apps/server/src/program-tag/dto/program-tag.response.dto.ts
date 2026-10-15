import { ApiProperty } from '@nestjs/swagger';

export class ProgramTagResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'home' })
  code: string;

  @ApiProperty({ example: 'Дом' })
  name: string;

  @ApiProperty({ description: 'Порядок чипа внутри группы' })
  position: number;

  @ApiProperty({ description: 'Группа тега' })
  groupId: number;
}
