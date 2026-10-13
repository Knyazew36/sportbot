import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { parseUserTime } from '@/bot';
import { Prisma, SportProfile } from '@/generated/prisma/client';

export const CITY_ZONES: { title: string; zone: string }[] = [
  { title: 'Калининград', zone: 'Europe/Kaliningrad' },
  { title: 'Москва', zone: 'Europe/Moscow' },
  { title: 'Самара', zone: 'Europe/Samara' },
  { title: 'Екатеринбург', zone: 'Asia/Yekaterinburg' },
  { title: 'Омск', zone: 'Asia/Omsk' },
  { title: 'Новосибирск', zone: 'Asia/Novosibirsk' },
  { title: 'Красноярск', zone: 'Asia/Krasnoyarsk' },
  { title: 'Иркутск', zone: 'Asia/Irkutsk' },
  { title: 'Якутск', zone: 'Asia/Yakutsk' },
  { title: 'Владивосток', zone: 'Asia/Vladivostok' },
  { title: 'Магадан', zone: 'Asia/Magadan' },
  { title: 'Камчатка', zone: 'Asia/Kamchatka' },
];

/** Шаги первого запуска: дни, время вопросов, программа, режим учёта. Часовой пояс — Москва по умолчанию, меняется в настройках. */
export const ONBOARDING_STEPS = 4;

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(`👤 ${ProfileService.name}`);

  constructor(private readonly prisma: PrismaService) {}

  // ── Настройки ───────────────────────────────────────────────────────────

  public async update(
    userId: number,
    data: Prisma.SportProfileUncheckedUpdateInput,
  ): Promise<SportProfile> {
    const profile = await this.prisma.sportProfile.update({
      where: { userId },
      data,
    });
    this.logger.log(
      `Настройки изменены: userId=${userId}, поля: ${Object.keys(data).join(', ')}`,
    );
    return profile;
  }

  /**
   * Пояс по введённому пользователем текущему времени: смещение от UTC с шагом в час,
   * фиксированный пояс Etc/GMT±N (у Etc знак обратный: UTC+5 — это Etc/GMT-5).
   */
  public zoneFromLocalTime(input: string, now = new Date()): string {
    const time = parseUserTime(input);
    if (!time)
      throw new BadRequestException(
        'Не понял время. Напиши, сколько у тебя сейчас, например «14:30».',
      );
    const [hour, minute] = time.split(':').map(Number);
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    let offset = Math.round((hour * 60 + minute - utcMinutes) / 60);
    if (offset > 14) offset -= 24;
    if (offset < -11) offset += 24;
    if (offset === 0) return 'Etc/GMT';
    return `Etc/GMT${offset > 0 ? '-' : '+'}${Math.abs(offset)}`;
  }

  public toggleDay(days: number[], day: number): number[] {
    return days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day].sort((a, b) => a - b);
  }

  // ── Удаление данных ─────────────────────────────────────────────────────

  /**
   * «Удалить мои данные»: уходит строка User и всё личное каскадом. Одобренные записи справочника
   * остаются без автора, копии программ у друзей — без источника.
   */
  public async deleteAccount(userId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Сначала свои программы и тренировки: они держат черновики через Restrict
      await tx.program.deleteMany({ where: { ownerId: userId } });
      await tx.workout.deleteMany({ where: { userId } });

      // Черновик, на который всё ещё кто-то ссылается, передаём этому человеку, а не удаляем
      const usedDrafts = await tx.exercise.findMany({
        where: {
          authorId: userId,
          status: 'DRAFT',
          OR: [
            { complexExercises: { some: {} } },
            { workoutExercises: { some: {} } },
          ],
        },
        select: {
          id: true,
          complexExercises: {
            take: 1,
            select: {
              complex: { select: { program: { select: { ownerId: true } } } },
            },
          },
          workoutExercises: {
            take: 1,
            select: { workout: { select: { userId: true } } },
          },
        },
      });
      for (const draft of usedDrafts) {
        const heir =
          draft.complexExercises[0]?.complex.program.ownerId ??
          draft.workoutExercises[0]?.workout.userId ??
          null;
        await tx.exercise.update({
          where: { id: draft.id },
          data: { authorId: heir },
        });
      }
      await tx.exercise.deleteMany({
        where: { authorId: userId, status: 'DRAFT' },
      });
      await tx.stretch.deleteMany({
        where: {
          authorId: userId,
          status: 'DRAFT',
          workoutStretches: { none: {} },
        },
      });
      await tx.user.delete({ where: { id: userId } });
    });
    this.logger.log(`Данные пользователя удалены: userId=${userId}`);
  }
}
