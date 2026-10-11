import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Подтверждение: нужно ввести слово «удалить»',
    example: 'удалить',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @Matches(/^удалить$/, {
    message: 'Для подтверждения введите слово «удалить»',
  })
  confirmation: string;
}
