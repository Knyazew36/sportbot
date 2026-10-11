import { ConfigService } from '@nestjs/config';

export function isDev(configService: ConfigService) {
  return configService.getOrThrow<string>('NODE_ENV') === 'development';
}

/**
 * Вариант без DI (фильтр исключений создаётся до контейнера). Функция, а не константа:
 * модуль импортируется раньше, чем ConfigModule прочитает .env. Dev — только при явном
 * NODE_ENV=development: забытая переменная на сервере не должна открывать стеки ошибок наружу.
 */
export function isDevEnv(): boolean {
  return process.env.NODE_ENV === 'development';
}
