import { type DynamicModule, Module, type Provider } from '@nestjs/common'

import { SupportOperatorController } from './controllers/support-operator.controller'
import { SupportVisitorController } from './controllers/support-visitor.controller'
import { SupportChatGateway } from './gateway/support-chat.gateway'
import { SupportNotifyListener } from './gateway/support-notify.listener'
import { SupportHostAuthGuard } from './guards/support-host-auth.guard'
import { SupportOperatorGuard } from './guards/support-operator.guard'
import { SupportVisitGuard } from './guards/support-visit.guard'
import { SupportFilesInterceptor } from './interceptors/support-files.interceptor'
import { SupportFileStorage, SupportIdentity, SupportNotifier, SupportStore } from './ports'
import { SupportChatMapper } from './services/support-chat.mapper'
import { SupportEvents } from './services/support-events'
import { SupportMessagingService } from './services/support-messaging.service'
import { SupportOperatorService } from './services/support-operator.service'
import { SupportVisitorService } from './services/support-visitor.service'
import { VisitTokenService } from './services/visit-token.service'
import { SUPPORT_CHAT_OPTIONS, SUPPORT_HOST_AUTH_GUARD } from './support-chat.constants'
import type { SupportChatModuleOptions, SupportChatResolvedOptions } from './support-chat.options'

const DEFAULT_VISIT_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000
const MIN_SECRET_LENGTH = 32

/**
 * Чат поддержки: REST посетителя (support/*) и операторов (support/operator/*), socket.io-неймспейс /support.
 * Всё проектное приходит через порты — SupportStore, SupportIdentity, SupportFileStorage, SupportNotifier.
 * Подключается один раз в app.module.ts: SupportChatModule.forRoot({...}).
 *
 * SupportEvents экспортируется: на доменные события можно подписаться снаружи (мосты в мессенджеры).
 */
@Module({})
export class SupportChatModule {
  public static forRoot(options: SupportChatModuleOptions): DynamicModule {
    if (options.secret.length < MIN_SECRET_LENGTH) {
      throw new Error(`SupportChatModule: secret должен быть не короче ${MIN_SECRET_LENGTH} символов`)
    }

    const resolved: SupportChatResolvedOptions = {
      workspaceKey: options.workspaceKey,
      secret: options.secret,
      identitySecret: options.identitySecret,
      visitTokenTtlMs: options.visitTokenTtlMs ?? DEFAULT_VISIT_TOKEN_TTL_MS,
      allowedOrigins: options.allowedOrigins,
    }

    const ports: Provider[] = [
      { provide: SupportStore, useClass: options.store },
      { provide: SupportIdentity, useClass: options.identity },
      { provide: SupportFileStorage, useClass: options.files },
      ...(options.notifier ? [{ provide: SupportNotifier, useClass: options.notifier }] : []),
      { provide: SUPPORT_HOST_AUTH_GUARD, useClass: options.authGuard },
    ]

    return {
      module: SupportChatModule,
      // Глобальный: мосты в мессенджеры проекта берут события и сервис операторов без импорта модуля
      global: true,
      imports: options.imports ?? [],
      controllers: [SupportVisitorController, SupportOperatorController],
      providers: [
        { provide: SUPPORT_CHAT_OPTIONS, useValue: resolved },
        ...ports,
        VisitTokenService,
        SupportEvents,
        SupportChatMapper,
        SupportMessagingService,
        SupportVisitorService,
        SupportOperatorService,
        SupportChatGateway,
        SupportNotifyListener,
        SupportVisitGuard,
        SupportHostAuthGuard,
        SupportOperatorGuard,
        SupportFilesInterceptor,
      ],
      exports: [SupportEvents, SupportStore, SupportOperatorService, SupportVisitorService, SupportChatGateway],
    }
  }
}
