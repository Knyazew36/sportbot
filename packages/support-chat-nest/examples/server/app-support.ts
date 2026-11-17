import { SupportChatModule } from '@app/support-chat-nest';
import { DynamicModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { createHmac } from 'crypto';

import { AppSupportFileStorage } from './app-support-file-storage';
import { AppSupportIdentity } from './app-support-identity';
import { AppSupportNotifier } from './app-support-notifier';
import { PrismaSupportStore } from './prisma-support.store';

// ЗАМЕНИТЬ: guard проекта, который кладёт пользователя в req.user (обычно JwtAuthGuard)
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/** Пространство чата: один бэкенд может обслуживать несколько сайтов. В обычном проекте — константа. */
export const SUPPORT_WORKSPACE_KEY = 'my-app'; // ЗАМЕНИТЬ

/**
 * Чат поддержки с адаптерами проекта. Подключается в imports AppModule ПОСЛЕ ConfigModule.forRoot:
 * тот синхронно загружает .env в process.env, а здесь переменные читаются сразу.
 */
export function supportChatModule(): DynamicModule {
  // Отдельный секрет необязателен: выводим из JWT_SECRET, чтобы токен визита не совпадал с JWT
  const secret =
    process.env.SUPPORT_CHAT_SECRET?.trim() ||
    createHmac('sha256', process.env.JWT_SECRET ?? '')
      .update('support-chat')
      .digest('hex');

  // Сокет проверяет origin так же, как HTTP CORS. ЗАМЕНИТЬ: тот же список, что в enableCors
  const allowed = (process.env.HTTP_CORS ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return SupportChatModule.forRoot({
    workspaceKey: SUPPORT_WORKSPACE_KEY,
    secret,
    identitySecret: process.env.SUPPORT_IDENTITY_SECRET?.trim() || undefined,
    allowedOrigins: allowed.length
      ? (origin) => allowed.includes(origin)
      : undefined,
    store: PrismaSupportStore,
    identity: AppSupportIdentity,
    files: AppSupportFileStorage,
    notifier: AppSupportNotifier, // необязательный — можно убрать
    authGuard: JwtAuthGuard,
    // Модули, из которых берут зависимости адаптеры. PrismaService — если его модуль не глобальный, добавить сюда
    imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  });
}
