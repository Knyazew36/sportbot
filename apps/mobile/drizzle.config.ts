import { defineConfig } from 'drizzle-kit';

// Миграции локальной базы: после правки схемы — `yarn db:generate`, результат коммитится.
// driver 'expo' собирает migrations.js, который приложение применяет при открытии базы
export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/shared/db/schema.ts',
  out: './src/shared/db/migrations',
});
