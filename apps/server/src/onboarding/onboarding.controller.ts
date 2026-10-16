import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { SportAuth } from '@/miniapp/decorators/sport-auth.decorator';

import { OnboardingDaysDto } from './dto/onboarding-days.dto';
import { OnboardingGenderDto } from './dto/onboarding-gender.dto';
import { OnboardingProgramDto } from './dto/onboarding-program.dto';
import { OnboardingStateResponseDto } from './dto/onboarding-state.response.dto';
import { OnboardingTimesDto } from './dto/onboarding-times.dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('onboarding')
@Controller('onboarding')
@SportAuth()
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  @Swagger({
    title: 'Первый запуск: текущий шаг, значения и шаблоны программ',
    response: OnboardingStateResponseDto,
    bearerAuth: true,
  })
  public state(@CurrentUser('id') userId: number) {
    return this.onboardingService.state(userId);
  }

  @Post('gender')
  @Swagger({
    title: 'Шаг 0 (только приложение): пол',
    body: OnboardingGenderDto,
    response: OnboardingStateResponseDto,
    bearerAuth: true,
  })
  public saveGender(
    @CurrentUser('id') userId: number,
    @Body() dto: OnboardingGenderDto,
  ) {
    return this.onboardingService.saveGender(userId, dto);
  }

  @Post('days')
  @Swagger({
    title: 'Шаг 1: тренировочные дни',
    body: OnboardingDaysDto,
    response: OnboardingStateResponseDto,
    bearerAuth: true,
  })
  public saveDays(
    @CurrentUser('id') userId: number,
    @Body() dto: OnboardingDaysDto,
  ) {
    return this.onboardingService.saveDays(userId, dto);
  }

  @Post('times')
  @Swagger({
    title: 'Шаг 2: время утреннего и вечернего вопроса',
    body: OnboardingTimesDto,
    response: OnboardingStateResponseDto,
    bearerAuth: true,
  })
  public saveTimes(
    @CurrentUser('id') userId: number,
    @Body() dto: OnboardingTimesDto,
  ) {
    return this.onboardingService.saveTimes(userId, dto);
  }

  @Post('program')
  @Swagger({
    title: 'Шаг 3: программа (шаблон или с нуля) и конец настройки',
    body: OnboardingProgramDto,
    response: OnboardingStateResponseDto,
    bearerAuth: true,
  })
  public finish(
    @CurrentUser('id') userId: number,
    @Body() dto: OnboardingProgramDto,
  ) {
    return this.onboardingService.finish(userId, dto);
  }
}
