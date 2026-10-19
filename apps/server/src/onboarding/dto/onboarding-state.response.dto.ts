import { ApiProperty } from '@nestjs/swagger';

import { OnboardingTemplateResponseDto } from './onboarding-template.response.dto';

export class OnboardingStateResponseDto {
  @ApiProperty({ description: 'Текущий шаг, 1..3' })
  step: number;

  @ApiProperty()
  onboarded: boolean;

  @ApiProperty({
    enum: ['MALE', 'FEMALE'],
    nullable: true,
    description: 'Пол; null — не выбран, приложение спросит первым шагом',
  })
  gender: 'MALE' | 'FEMALE' | null;

  @ApiProperty({ type: [Number], description: '0..6, 0 — воскресенье' })
  trainingDays: number[];

  @ApiProperty({ example: '08:00' })
  morningTime: string;

  @ApiProperty({ example: '20:00' })
  eveningTime: string;

  @ApiProperty({
    description: 'Повторять вопрос без ответа: утренний через 2 часа, вечерний наутро',
  })
  remindersEnabled: boolean;

  @ApiProperty({
    description: 'false — бот не пишет утренний и вечерний вопросы',
  })
  questionsEnabled: boolean;

  @ApiProperty({ type: [OnboardingTemplateResponseDto] })
  templates: OnboardingTemplateResponseDto[];
}
