import { ApiProperty } from '@nestjs/swagger';

export class MaxLoginStatusUserDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ nullable: true, type: String })
  email: string | null;
}
