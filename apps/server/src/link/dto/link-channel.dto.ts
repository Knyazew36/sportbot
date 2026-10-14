import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class LinkChannelDto {
  @ApiProperty({ enum: ['TELEGRAM', 'MAX'] })
  @IsIn(['TELEGRAM', 'MAX'])
  channel: 'TELEGRAM' | 'MAX';
}
