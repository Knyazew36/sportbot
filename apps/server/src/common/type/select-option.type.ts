import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export interface SelectOption {
  label: string;
  value: string;
}

export class SelectOptionResponse {
  @ApiProperty({
    example: 'Фронт',
  })
  @IsString()
  label: string;

  @ApiProperty({
    example: '1',
  })
  @IsString()
  value: string;
}
