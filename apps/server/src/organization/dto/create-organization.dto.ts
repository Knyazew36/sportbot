import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ description: 'Название организации', example: 'Моя команда' })
  @IsString()
  @MinLength(2, { message: 'Название не короче 2 символов' })
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    type: Object,
    description:
      'Произвольные настройки организации. При обновлении переданные ключи заменяют прежние, остальные сохраняются',
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
