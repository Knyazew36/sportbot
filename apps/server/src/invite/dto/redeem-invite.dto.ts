import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Квери для GET /invite/preview — превью приглашения по ссылке. */
export class RedeemQueryDto {
  @ApiProperty({ description: 'Токен из ссылки-приглашения' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  token: string;
}

/** Тело POST /invite/redeem — вступить в организацию по ссылке-приглашению. */
export class RedeemInviteDto {
  @ApiProperty({ description: 'Токен из ссылки-приглашения' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  token: string;
}
