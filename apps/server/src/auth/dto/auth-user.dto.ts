import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty()
  id: number;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'null — аккаунт заведён через бота мессенджера',
  })
  email: string | null;
}
