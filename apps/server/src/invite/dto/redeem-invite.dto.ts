import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

/** Квери для GET /invite/preview — превью приглашения по ссылке. */
export class RedeemQueryDto {
  @ApiProperty({ description: 'Токен из ссылки-приглашения' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  token: string
}

/** Тело POST /invite/redeem — вступить в организацию по ссылке-приглашению. */
export class RedeemInviteDto {
  @ApiProperty({ description: 'Токен из ссылки-приглашения' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  token: string

  @ApiPropertyOptional({
    description: 'Заявка от имени своего ребёнка (id из GET /user/me/children), а не от себя',
  })
  @IsOptional()
  @IsInt()
  childUserId?: number
}
