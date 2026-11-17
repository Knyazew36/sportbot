import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({
    description: 'Идея или описание проблемы',
    example: 'Хочу видеть вес прошлой тренировки в подходе',
    minLength: 5,
    maxLength: 1000,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(5, { message: 'Напиши хотя бы пару слов' })
  @MaxLength(1000, { message: 'До 1000 символов' })
  text: string;
}
