import { config } from 'dotenv';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');

/**
 * Строка подключения к тестовой базе. TEST_DATABASE_URL из окружения или `.env.test.local`;
 * иначе — DATABASE_URL из `.env` с базой `sportbot_test`: те же логин и пароль, что у dev-базы.
 */
export function testDatabaseUrl(): string {
  config({ path: resolve(root, '.env.test.local'), quiet: true });
  const explicit = process.env.TEST_DATABASE_URL;
  const url = explicit ?? fromDevUrl();
  const name = new URL(url).pathname.slice(1);
  // Тесты делают TRUNCATE всех таблиц — на рабочей базе это катастрофа
  if (!name.endsWith('_test'))
    throw new Error(
      `Тестовая база должна называться *_test, а не «${name}». Проверь TEST_DATABASE_URL.`,
    );
  return url;
}

function fromDevUrl(): string {
  const env: Record<string, string> = {};
  config({ path: resolve(root, '.env'), processEnv: env, quiet: true });
  if (!env.DATABASE_URL)
    throw new Error(
      'Нет ни TEST_DATABASE_URL, ни DATABASE_URL в apps/server/.env — не из чего собрать адрес тестовой базы.',
    );
  const url = new URL(env.DATABASE_URL);
  url.pathname = '/sportbot_test';
  return url.toString();
}
