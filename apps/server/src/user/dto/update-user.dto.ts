import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Имя' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Фамилия' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Телефон (опционально)' })
  @IsOptional()
  @IsString()
  @Matches(/^[+\d][\d\s()-]{9,}$/, { message: 'Некорректный телефон' })
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ description: 'Права платформенного администратора' })
  @IsOptional()
  @IsBoolean()
  isPlatformAdmin?: boolean;
}
