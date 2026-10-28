import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { localToday } from '@/bot';
import { SportProfile } from '@/generated/prisma/client';

@Injectable()
export class LimitationService {
  private readonly logger = new Logger(`🦴 ${LimitationService.name}`);

  constructor(private readonly prisma: PrismaService) {}

  // ── Чтение ──────────────────────────────────────────────────────────────

  public async active(userId: number, today: Date) {
    return this.prisma.limitation.findMany({
      where: {
        userId,
        cancelledAt: null,
        startDate: { lte: today },
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
      include: { joint: true },
      orderBy: { id: 'asc' },
    });
  }

  /** id зон с действующим ограничением — для пометки ⚠️ и фильтра аналогов. */
  public async activeJointIds(profile: SportProfile): Promise<Set<number>> {
    const items = await this.active(
      profile.userId,
      localToday(profile.timeZone),
    );
    return new Set(items.map((item) => item.jointId));
  }

  // ── Запись ──────────────────────────────────────────────────────────────

  /** @returns нужно ли показать дисклеймер (показывается один раз за всё время). */
  public async add(
    profile: SportProfile,
    jointId: number,
    endDate: Date | null,
    /** clientId ограничения с телефона: после синка у телефона та же строка */
    clientId?: string,
  ): Promise<{ jointName: string; showDisclaimer: boolean }> {
    const today = localToday(profile.timeZone);
    // Повторное включение той же зоны заменяет срок, а не плодит строки
    await this.prisma.limitation.updateMany({
      where: { userId: profile.userId, jointId, cancelledAt: null },
      data: { cancelledAt: new Date() },
    });
    const limitation = await this.prisma.limitation.create({
      data: {
        userId: profile.userId,
        jointId,
        startDate: today,
        endDate,
        ...(clientId ? { clientId } : {}),
      },
      include: { joint: true },
    });
    const showDisclaimer = !profile.jointDisclaimerShownAt;
    if (showDisclaimer)
      await this.prisma.sportProfile.update({
        where: { userId: profile.userId },
        data: { jointDisclaimerShownAt: new Date() },
      });
    this.logger.log(
      `Ограничение включено: limitationId=${limitation.id}, userId=${profile.userId}, jointId=${jointId}`,
    );
    return { jointName: limitation.joint.name, showDisclaimer };
  }

  // ── Приложение ──────────────────────────────────────────────────────────

  public async listByUser(userId: number) {
    const profile = await this.prisma.sportProfile.findUniqueOrThrow({
      where: { userId },
    });
    const items = await this.active(userId, localToday(profile.timeZone));
    return items.map((item) => ({
      id: item.id,
      jointId: item.jointId,
      jointName: item.joint.name,
      startDate: item.startDate.toISOString().slice(0, 10),
      endDate: item.endDate ? item.endDate.toISOString().slice(0, 10) : null,
    }));
  }

  /** Включить ограничение из приложения: зона и срок «до даты» или «до отмены». */
  public async addByUser(
    userId: number,
    jointId: number,
    endDate: string | null,
    clientId?: string,
  ) {
    const [profile, joint] = await Promise.all([
      this.prisma.sportProfile.findUniqueOrThrow({ where: { userId } }),
      this.prisma.joint.findUnique({ where: { id: jointId } }),
    ]);
    if (!joint) throw new NotFoundException('Такой зоны нет.');
    const end = endDate ? new Date(`${endDate}T00:00:00.000Z`) : null;
    if (end && end < localToday(profile.timeZone))
      throw new BadRequestException('Дата окончания уже прошла.');
    return this.add(profile, jointId, end, clientId);
  }

  /** Снять ограничение с телефона — по clientId. @returns было ли оно ещё действующим */
  public async cancelByClientId(
    userId: number,
    clientId: string,
  ): Promise<boolean> {
    const { count } = await this.prisma.limitation.updateMany({
      where: { clientId, userId, cancelledAt: null },
      data: { cancelledAt: new Date() },
    });
    if (count)
      this.logger.log(
        `Ограничение снято с телефона: clientId=${clientId}, userId=${userId}`,
      );
    return count > 0;
  }

  public async cancel(userId: number, limitationId: number): Promise<void> {
    const { count } = await this.prisma.limitation.updateMany({
      where: { id: limitationId, userId, cancelledAt: null },
      data: { cancelledAt: new Date() },
    });
    if (!count) throw new NotFoundException('Ограничение уже снято.');
    this.logger.log(
      `Ограничение снято: limitationId=${limitationId}, userId=${userId}`,
    );
  }
}
