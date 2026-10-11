import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { User } from '@/generated/prisma/client';
import { PrismaService } from 'prisma/prisma.service';

import { AuthStrategyRegistry } from '../auth-strategy.registry';
import {
  AuthProvider,
  RequestWithOrganization,
} from '../types/request-with-organization';
import { upsertVkUserFromLaunchParams } from '../vk/upsert-vk-user';

import { AuthStrategy } from './auth-strategies.type';

// Фронт кладёт window.location.search (vk_*-параметры + sign) в этот заголовок
const LAUNCH_PARAMS_HEADER = 'x-vk-launch-params';

/**
 * Per-request аутентификация по сырым VK Mini App launch-параметрам.
 *
 * Подпись проверяется на каждом запросе — предварительный обмен на JWT
 * (POST /auth/vk/miniapp) не требуется. Стратегия параллельна JwtAuthStrategy:
 * заголовки разные (X-VK-Launch-Params против Authorization: Bearer), поэтому
 * в MultiAuthGuard конфликта нет.
 */
@Injectable()
export class VkAuthStrategy implements AuthStrategy, OnModuleInit {
  provider: AuthProvider = 'vk';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly registry: AuthStrategyRegistry,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  supports(req: RequestWithOrganization): boolean {
    return Boolean(req.header(LAUNCH_PARAMS_HEADER));
  }

  authenticate(req: RequestWithOrganization): Promise<User> {
    const launchParams = String(req.header(LAUNCH_PARAMS_HEADER) || '');
    const secret = this.configService.get<string>('VK_APP_SECRET') ?? '';

    return upsertVkUserFromLaunchParams(this.prisma, launchParams, secret);
  }
}
