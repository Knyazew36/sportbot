import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

import { JoinRequestStatus } from '@/generated/prisma/client';
import { PaginationQueryDto } from '@/common/type';

export class JoinRequestQueryDto extends PaginationQueryDto {
  @ApiProperty({
    description: 'ID организации (обязательный фильтр)',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizationId: number;

  @ApiPropertyOptional({
    description: 'Фильтр по статусу. Не указан — все статусы',
    enum: JoinRequestStatus,
  })
  @IsOptional()
  @IsEnum(JoinRequestStatus)
  status?: JoinRequestStatus;
}
