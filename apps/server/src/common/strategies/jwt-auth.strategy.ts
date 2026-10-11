import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { User } from '@/generated/prisma/client';
import { PrismaService } from 'prisma/prisma.service';

import { AuthStrategyRegistry } from '../auth-strategy.registry';
import { RequestWithOrganization } from '../types/request-with-organization';

import { AuthStrategy } from './auth-strategies.type';
import { AuthProvider } from '../types/request-with-organization';

interface AppJwtPayload {
  sub: number;
  provider: AuthProvider;
  /** User.tokenVersion на момент выдачи; у токенов, выпущенных до появления поля, отсутствует */
  ver?: number;
}

const ALLOWED_PROVIDERS: AuthProvider[] = ['email', 'vk', 'telegram', 'max'];

/**
 * Единая стратегия per-request аутентификации: Bearer JWT, выданный любым способом
 * входа (email+пароль или подтверждение в боте мессенджера). Способ входа сохранён в payload.provider,
 * но на доступ не влияет — доменная роль выводится из связей (см. AuthService).
 */
@Injectable()
export class JwtAuthStrategy implements AuthStrategy, OnModuleInit {
  provider: AuthProvider = 'email';

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly registry: AuthStrategyRegistry,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  supports(req: RequestWithOrganization): boolean {
    const authHeader = String(req.header('authorization') || '');
    return authHeader.startsWith('Bearer ');
  }

  async authenticate(req: RequestWithOrganization): Promise<User> {
    const authHeader = String(req.header('authorization') || '');
    const token = authHeader.slice('Bearer '.length);

    if (!token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    let payload: AppJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<AppJwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Невалидный или истёкший токен');
    }

    if (
      typeof payload.sub !== 'number' ||
      !ALLOWED_PROVIDERS.includes(payload.provider)
    ) {
      throw new UnauthorizedException('Невалидный токен');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // Версия меняется при смене/сбросе пароля — токены, выданные до этого, перестают действовать
    if ((payload.ver ?? 0) !== user.tokenVersion) {
      throw new UnauthorizedException('Сессия завершена, войдите заново');
    }

    return user;
  }
}
