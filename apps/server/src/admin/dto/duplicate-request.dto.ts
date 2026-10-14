import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

export class DuplicateRequestDto {
  @ApiProperty({ description: 'Запись справочника, которая заменит черновик' })
  @IsInt()
  targetId: number;

  @ApiPropertyOptional({ description: 'Комментарий для автора' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
