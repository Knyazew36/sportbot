import { resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/** Интеграционные тесты: настоящие сервисы на отдельной базе Postgres (см. test/README.md). */
export default defineConfig({
  // swc вместо esbuild: Nest нужен emitDecoratorMetadata, esbuild его не умеет
  plugins: [swc.vite({ module: { type: 'es6' } })],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      prisma: resolve(__dirname, 'prisma'),
      src: resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['test/**/*.int-spec.ts'],
    globals: true,
    environment: 'node',
    globalSetup: ['test/setup/global-setup.ts'],
    setupFiles: ['test/setup/env.ts'],
    // Одна база на все файлы: тесты чистят её целиком, параллельно им нельзя
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
