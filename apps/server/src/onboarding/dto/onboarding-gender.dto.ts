import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class OnboardingGenderDto {
  @ApiProperty({
    enum: ['MALE', 'FEMALE'],
    description: 'Пол: задаёт расцветку',
  })
  @IsIn(['MALE', 'FEMALE'], { message: 'Выбери пол' })
  gender: 'MALE' | 'FEMALE';
}
