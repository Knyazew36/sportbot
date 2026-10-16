import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

export class CloseComplaintDto {
  @ApiProperty({
    enum: ['RESOLVED', 'REJECTED'],
    description: 'Исправлено или отклонено',
  })
  @IsIn(['RESOLVED', 'REJECTED'])
  status: 'RESOLVED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'Причина отказа — уйдёт автору' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(200, { message: 'До 200 символов' })
  reason?: string;
}
