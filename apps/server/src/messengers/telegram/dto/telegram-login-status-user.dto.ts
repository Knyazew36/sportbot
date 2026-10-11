import { ApiProperty } from '@nestjs/swagger';

export class TelegramLoginStatusUserDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ nullable: true, type: String })
  email: string | null;
}
