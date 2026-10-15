import { ApiProperty } from '@nestjs/swagger';

export class ProgramTagResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'home' })
  code: string;

  @ApiProperty({ example: 'Дом' })
  name: string;

  @ApiProperty({ description: 'Порядок чипов' })
  position: number;
}
