import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional } from 'class-validator'

export class JoinOrganizationDto {
  @ApiPropertyOptional({
    description: 'Вступить от имени своего ребёнка (id из GET /user/me/children), а не от себя',
  })
  @IsOptional()
  @IsInt()
  childUserId?: number
}
