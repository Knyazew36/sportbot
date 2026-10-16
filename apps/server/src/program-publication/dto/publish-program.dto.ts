import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { Trim } from '@/common/decorators/trim.decorator';

import { PublishProgramTagDto } from './publish-program-tag.dto';

export class PublishProgramDto {
  @ApiProperty({ description: 'Для кого программа и как по ней заниматься' })
  @Trim()
  @IsString()
  @MinLength(20, { message: 'Опиши программу хотя бы в 20 символов' })
  @MaxLength(1000, { message: 'Описание — до 1000 символов' })
  description: string;

  @ApiProperty({
    type: [Number],
    description:
      'Теги справочника и свои теги автора, уже стоящие на программе',
  })
  @IsArray()
  @IsInt({ each: true })
  tagIds: number[];

  @ApiProperty({ type: [PublishProgramTagDto], description: 'Новые свои теги' })
  @IsArray()
  @ArrayMaxSize(3, { message: 'Своих тегов — не больше 3' })
  @ValidateNested({ each: true })
  @Type(() => PublishProgramTagDto)
  newTags: PublishProgramTagDto[];
}
