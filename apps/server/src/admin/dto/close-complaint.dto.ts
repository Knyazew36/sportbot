import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class CloseComplaintDto {
  @ApiProperty({
    enum: ['RESOLVED', 'REJECTED'],
    description: 'Исправлено или отклонено',
  })
  @IsIn(['RESOLVED', 'REJECTED'])
  status: 'RESOLVED' | 'REJECTED';
}
