import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator'

import { WorkHoursDto } from './work-hours.dto'

export class OrganizationSettingsDto {
  @ApiPropertyOptional({
    type: WorkHoursDto,
    description: 'Рабочее время: в сетке расписания показываются только эти часы. Не задано — сутки целиком',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkHoursDto)
  workHours?: WorkHoursDto

  @ApiPropertyOptional({
    description:
      'Показывать состав занятия (записавшихся) участникам кружка, а не только владельцу. По умолчанию — false',
  })
  @IsOptional()
  @IsBoolean()
  showParticipantsToMembers?: boolean
}
