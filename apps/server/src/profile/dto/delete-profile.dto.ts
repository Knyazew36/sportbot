import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class DeleteProfileDto {
  @ApiProperty({
    example: 'удалить',
    description: 'Подтверждение словом «удалить»',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @Matches(/^удалить$/, { message: 'Для подтверждения введи слово «удалить»' })
  confirmation: string;
}
