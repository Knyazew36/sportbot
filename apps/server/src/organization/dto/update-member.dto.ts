import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional } from 'class-validator'

import { OrgRole } from '@/generated/prisma/client'

export class UpdateMemberDto {
  @ApiPropertyOptional({
    enum: OrgRole,
    description:
      'Новая роль. `OWNER` = передача владения: текущий владелец становится MEMBER, ' +
      'Organization.ownerUserId переписывается. Прямое понижение владельца до MEMBER запрещено — только через передачу',
  })
  @IsOptional()
  @IsEnum(OrgRole)
  role?: OrgRole
}
