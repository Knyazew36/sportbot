import { ApiProperty } from '@nestjs/swagger';

export class ProgramListItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  complexCount: number;

  @ApiProperty()
  active: boolean;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Копия от друга: его имя',
  })
  fromFriend: string | null;

  @ApiProperty({ description: 'Друг обновил программу после копирования' })
  sourceUpdated: boolean;
}
