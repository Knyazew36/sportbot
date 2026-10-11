import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class UpdateChildDto {
  @ApiPropertyOptional({ description: 'Имя ребёнка' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string

  @ApiPropertyOptional({ description: 'Фамилия ребёнка' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string

  @ApiPropertyOptional({ description: 'Дата рождения', example: '2015-09-01' })
  @IsOptional()
  @IsDateString()
  birthDate?: string
}
