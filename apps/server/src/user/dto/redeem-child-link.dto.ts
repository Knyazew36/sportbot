import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class RedeemChildLinkDto {
  @ApiProperty({ description: 'Токен ссылки, которую прислал другой родитель' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  token!: string
}
