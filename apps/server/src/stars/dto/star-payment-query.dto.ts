import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

import { PaginationQueryDto } from '@/common/type';
import { StarPaymentStatus } from '@/generated/prisma/client';

export class StarPaymentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: StarPaymentStatus,
    enumName: 'StarPaymentStatus',
  })
  @IsOptional()
  @IsEnum(StarPaymentStatus)
  filter_status?: StarPaymentStatus;

  @ApiPropertyOptional({ type: Number, description: 'Платежи одного пользователя' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  filter_userId?: number;
}
