// Заглушка @nestjs/throttler для jest. Пакет 6.x — CJS и внутри делает
// require('@nestjs/common'); jest-runtime не умеет require() ESM-модуля (NestJS 12 — ESM),
// поэтому в тестах подменяем throttler на no-op. В рантайме Node 22 require(esm) работает,
// подмена только для тестов (см. jest.config.mjs moduleNameMapper).

export class ThrottlerGuard {
  canActivate() {
    return true
  }
}

export const Throttle = () => () => undefined
export const SkipThrottle = () => () => undefined

export class ThrottlerModule {
  static forRoot() {
    return { module: ThrottlerModule, providers: [], exports: [] }
  }

  static forRootAsync() {
    return { module: ThrottlerModule, providers: [], exports: [] }
  }
}
