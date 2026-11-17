import {
  SupportIdentity,
  type SupportOperator,
  type SupportRequestLike,
  type SupportUserIdentity,
} from '@app/support-chat-nest';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// ЗАМЕНИТЬ: сервис Prisma проекта и модель пользователя
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Кто есть кто в чате. Посетитель — любой пользователь проекта (или аноним без авторизации),
 * оператор — тот, кому проект разрешает отвечать клиентам.
 *
 * Образец под Bearer JWT с `sub` = id пользователя. Если в проекте другая авторизация (сессии, cookie,
 * несколько стратегий) — заменить authenticate(): он должен по заголовкам запроса вернуть пользователя
 * или null, не бросая исключений.
 */
@Injectable()
export class AppSupportIdentity extends SupportIdentity {
  private readonly logger = new Logger(`🎧 ${AppSupportIdentity.name}`);

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  // ── Идентификация ──────────────────────────────────────────────────────────

  public async resolveUser(
    request: SupportRequestLike,
  ): Promise<SupportUserIdentity | null> {
    const user = await this.authenticate(request);
    return user
      ? {
          externalUserId: String(user.id),
          name: this.displayName(user),
          email: user.email,
          phone: null, // ЗАМЕНИТЬ: user.phone, если поле есть
        }
      : null;
  }

  public async resolveOperator(
    request: SupportRequestLike,
  ): Promise<SupportOperator | null> {
    // В HTTP пользователя уже положил authGuard проекта, в сокете — проверяем заголовки сами
    const user =
      (request.user as User | undefined) ?? (await this.authenticate(request));
    return user && this.isOperator(user) ? this.toOperator(user) : null;
  }

  public async findOperator(id: number): Promise<SupportOperator | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user && this.isOperator(user) ? this.toOperator(user) : null;
  }

  // ── Внутреннее ─────────────────────────────────────────────────────────────

  // ЗАМЕНИТЬ: правило проекта, кто оператор поддержки (роль, флаг, членство в команде)
  private isOperator(user: User): boolean {
    return (user as User & { role?: string }).role === 'ADMIN';
  }

  /** Необязательная авторизация: нет заголовка или он невалиден — null, без исключения. */
  private async authenticate(
    request: SupportRequestLike,
  ): Promise<User | null> {
    const header = request.headers.authorization;
    const value = Array.isArray(header) ? header[0] : header;
    const token = value?.startsWith('Bearer ') ? value.slice(7) : null;
    if (!token) return null;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: number | string }>(
        token,
      );
      return await this.prisma.user.findUnique({
        where: { id: Number(payload.sub) },
      });
    } catch (error) {
      this.logger.debug(
        `Токен не прошёл проверку: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  private toOperator(user: User): SupportOperator {
    return { id: user.id, name: this.displayName(user) };
  }

  // ЗАМЕНИТЬ: из каких полей собирается имя
  private displayName(user: User): string | null {
    return (user as User & { name?: string | null }).name ?? null;
  }
}
