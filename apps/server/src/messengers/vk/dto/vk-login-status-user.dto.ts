import { ApiProperty } from '@nestjs/swagger';

export class VkLoginStatusUserDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ nullable: true, type: String })
  email: string | null;
}
