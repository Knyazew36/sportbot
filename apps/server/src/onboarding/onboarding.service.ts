import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { SportAccountService } from '@/bot/sport-account.service';
import { SportProfile } from '@/generated/prisma/client';
import { ONBOARDING_STEPS } from '@/profile/profile.service';
import { ProgramService } from '@/program/program.service';

import { OnboardingDaysDto } from './dto/onboarding-days.dto';
import { OnboardingGenderDto } from './dto/onboarding-gender.dto';
import { OnboardingProgramDto } from './dto/onboarding-program.dto';
import { OnboardingStateResponseDto } from './dto/onboarding-state.response.dto';
import { OnboardingTimesDto } from './dto/onboarding-times.dto';

/**
 * Первый запуск из приложения (business-tz, 13): дни → время вопросов → программа.
 * Шаг общий с ботом: начатое там продолжается здесь и наоборот.
 */
@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(`🚀 ${OnboardingService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: SportAccountService,
    private readonly programs: ProgramService,
  ) {}

  // ── Чтение ──────────────────────────────────────────────────────────────

  public async state(userId: number): Promise<OnboardingStateResponseDto> {
    const [profile, templates] = await Promise.all([
      this.accounts.profile(userId),
      this.programs.templates(),
    ]);
    return {
      step: profile.onboardingStep,
      onboarded: !!profile.onboardedAt,
      gender: profile.gender,
      trainingDays: profile.trainingDays,
      morningTime: profile.morningTime,
      eveningTime: profile.eveningTime,
      remindersEnabled: profile.remindersEnabled,
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        complexCount: t._count.complexes,
        tags: t.tags,
      })),
    };
  }

  // ── Шаги ────────────────────────────────────────────────────────────────

  /** Шаг только приложения: бот пол не спрашивает, поэтому счётчик шагов не двигаем. */
  public async saveGender(
    userId: number,
    dto: OnboardingGenderDto,
  ): Promise<OnboardingStateResponseDto> {
    await this.prisma.sportProfile.update({
      where: { userId },
      data: { gender: dto.gender },
    });
    this.logger.log(`Шаг 0, пол: userId=${userId}, ${dto.gender}`);
    return this.state(userId);
  }

  public async saveDays(
    userId: number,
    dto: OnboardingDaysDto,
  ): Promise<OnboardingStateResponseDto> {
    const profile = await this.accounts.profile(userId);
    await this.prisma.sportProfile.update({
      where: { userId },
      data: {
        trainingDays: [...dto.trainingDays].sort((a, b) => a - b),
        onboardingStep: this.nextStep(profile, 1),
      },
    });
    this.logger.log(
      `Шаг 1, дни: userId=${userId}, [${dto.trainingDays.join(',')}]`,
    );
    return this.state(userId);
  }

  public async saveTimes(
    userId: number,
    dto: OnboardingTimesDto,
  ): Promise<OnboardingStateResponseDto> {
    const profile = await this.accounts.profile(userId);
    await this.prisma.sportProfile.update({
      where: { userId },
      data: {
        morningTime: dto.morningTime,
        eveningTime: dto.eveningTime,
        remindersEnabled: dto.remindersEnabled,
        onboardingStep: this.nextStep(profile, 2),
      },
    });
    this.logger.log(
      `Шаг 2, время: userId=${userId}, ${dto.morningTime} / ${dto.eveningTime}, напоминания=${dto.remindersEnabled ?? 'без изменений'}`,
    );
    return this.state(userId);
  }

  /**
   * Шаг программы и конец настройки. Без выбора — первый шаблон, как «Далее» в боте.
   * Повторный вызов после конца настройки ничего не меняет.
   */
  public async finish(
    userId: number,
    dto: OnboardingProgramDto,
  ): Promise<OnboardingStateResponseDto> {
    const profile = await this.accounts.profile(userId);
    if (profile.onboardedAt) {
      this.logger.warn(`Настройка уже закончена: userId=${userId}`);
      return this.state(userId);
    }

    const programId = await this.pickProgram(userId, profile, dto);
    if (programId) await this.programs.setActive(userId, programId);
    await this.prisma.sportProfile.update({
      where: { userId },
      data: { onboardingStep: ONBOARDING_STEPS, onboardedAt: new Date() },
    });
    this.logger.log(
      `Настройка закончена: userId=${userId}, programId=${programId ?? '—'}`,
    );
    return this.state(userId);
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  /** Шаг вперёд только с текущего: правка прошлого шага кнопкой «Назад» не откатывает прогресс. */
  private nextStep(profile: SportProfile, done: number): number {
    return Math.max(profile.onboardingStep, done + 1);
  }

  private async pickProgram(
    userId: number,
    profile: SportProfile,
    dto: OnboardingProgramDto,
  ): Promise<number | null> {
    if (dto.scratch)
      return (await this.programs.create(userId, 'Моя программа')).id;

    if (dto.templateId) {
      return (await this.programs.takeTemplate(dto.templateId, userId)).id;
    }

    // Программа уже выбрана в боте — её и оставляем
    if (profile.activeProgramId) return null;
    const [first] = await this.programs.templates();
    return first ? (await this.programs.copy(first.id, userId)).id : null;
  }
}
