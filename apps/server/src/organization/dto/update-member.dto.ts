import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { OrgRole } from '@/generated/prisma/client';

export class UpdateMemberDto {
  @ApiPropertyOptional({
    enum: OrgRole,
    description:
      'Новая роль. `OWNER` = передача владения: прежний владелец становится ADMIN. ' +
      'Понизить владельца напрямую нельзя — только через передачу',
  })
  @IsOptional()
  @IsEnum(OrgRole)
  role?: OrgRole;
}
