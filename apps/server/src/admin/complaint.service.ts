import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { BotSender, msg } from '@/bot';
import { EXERCISE_INCLUDE, STRETCH_INCLUDE } from '@/catalog/catalog.service';
import {
  exerciseForm,
  type ExerciseProposal,
  readProposal,
  stretchForm,
  type StretchProposal,
} from '@/catalog/catalog-proposal';
import { ComplaintStatus } from '@/generated/prisma/client';

import { AdminCatalogService } from './admin-catalog.service';

type ClosedStatus = Exclude<ComplaintStatus, 'OPEN'>;

/**
 * Исход жалобы или правки — одинаковый из бота и из админки Mini App:
 * закрыть, применить правку, написать автору.
 */
@Injectable()
export class ComplaintService {
  private readonly logger = new Logger(`🛠 ${ComplaintService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminCatalog: AdminCatalogService,
    private readonly sender: BotSender,
  ) {}

  // ── Исход ───────────────────────────────────────────────────────────────

  /** Меняется только из OPEN: повторное нажатие получает false («уже обработано»). */
  public async close(
    complaintId: number,
    status: ClosedStatus,
    reason?: string,
  ): Promise<boolean> {
    const { count } = await this.prisma.complaint.updateMany({
      where: { id: complaintId, status: 'OPEN' },
      data: { status, reason: reason?.trim() || null },
    });
    if (!count) {
      this.logger.warn(
        `Жалоба уже обработана: complaintId=${complaintId}, статус=${status}`,
      );
      return false;
    }
    this.logger.log(
      `Жалоба закрыта: complaintId=${complaintId}, статус=${status}`,
    );
    await this.notifyAuthor(complaintId);
    return true;
  }

  /** Правка применяется как есть: запись обновляется, жалоба закрывается «исправлено». */
  public async apply(complaintId: number): Promise<boolean> {
    const complaint = await this.prisma.complaint.findFirst({
      where: { id: complaintId, status: 'OPEN' },
      include: {
        exercise: { include: EXERCISE_INCLUDE },
        stretch: { include: STRETCH_INCLUDE },
      },
    });
    if (!complaint) return false;
    const proposal = readProposal(complaint.proposal);
    if (!proposal || !(complaint.exercise ?? complaint.stretch))
      throw new BadRequestException(
        'Это жалоба без правки — исправь запись вручную.',
      );
    // Картинка не менялась — imagePath undefined, и кэш файла в мессенджерах не сбрасывается
    const imagePath = proposal.imagePath as string | null | undefined;
    if (complaint.exercise)
      await this.adminCatalog.updateExercise(complaint.exercise.id, {
        ...exerciseForm(complaint.exercise),
        ...(proposal as ExerciseProposal),
        imagePath,
      });
    else if (complaint.stretch)
      await this.adminCatalog.updateStretch(complaint.stretch.id, {
        ...stretchForm(complaint.stretch),
        ...(proposal as StretchProposal),
        kind: complaint.stretch.kind,
        imagePath,
      });
    this.logger.log(
      `Правка применена: complaintId=${complaintId}, ${complaint.exercise ? `exerciseId=${complaint.exercise.id}` : `stretchId=${complaint.stretchId}`}`,
    );
    return this.close(complaintId, 'RESOLVED');
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private async notifyAuthor(complaintId: number): Promise<void> {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        exercise: { select: { name: true } },
        stretch: { select: { name: true } },
      },
    });
    if (!complaint?.userId) return;
    const title = complaint.exercise?.name ?? complaint.stretch?.name ?? '';
    const isProposal = !!complaint.proposal;
    const text =
      complaint.status === 'RESOLVED'
        ? isProposal
          ? `Твою правку к «${title}» приняли — запись уже обновлена. Спасибо!`
          : `Жалобу на «${title}» разобрали — описание исправили. Спасибо!`
        : [
            `${isProposal ? 'Правку к' : 'Жалобу на'} «${title}» отклонили.`,
            complaint.reason && `Причина: ${complaint.reason}`,
          ]
            .filter(Boolean)
            .join('\n');
    const sent = await this.sender.sendToUserId(complaint.userId, msg(text));
    this.logger.debug(
      `Автору ${sent ? 'отправлен' : 'не доставлен'} исход: complaintId=${complaintId}, userId=${complaint.userId}`,
    );
  }
}
