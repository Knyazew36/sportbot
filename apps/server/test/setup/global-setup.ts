import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { Client } from 'pg';

import { testDatabaseUrl } from './database-url';

/** Перед всеми тестами: база есть и на ней свежие миграции. */
export default async function globalSetup(): Promise<void> {
  const url = testDatabaseUrl();
  const name = new URL(url).pathname.slice(1);

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
  } catch (error) {
    const reason = (error as Error).message;
    throw new Error(
      [
        '',
        `Не удалось подключиться к тестовой базе «${name}»: ${reason}`,
        '',
        'Создай её один раз (владелец — пользователь из DATABASE_URL):',
        `  createdb -O <user> ${name}`,
        '',
        'Подробнее — apps/server/test/README.md.',
        '',
      ].join('\n'),
    );
  } finally {
    await client.end().catch(() => undefined);
  }

  execSync('npx prisma migrate deploy', {
    cwd: resolve(__dirname, '../..'),
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });
}
