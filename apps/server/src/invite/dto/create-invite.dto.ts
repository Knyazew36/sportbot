import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateInviteDto {
  @ApiProperty({
    description: 'ID организации, для которой создаётся приглашение',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizationId: number;

  @ApiPropertyOptional({
    description: 'Срок действия (ISO). Не указан — бессрочно',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
