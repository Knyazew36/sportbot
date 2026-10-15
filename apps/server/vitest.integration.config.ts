import { resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig, type ViteUserConfig } from 'vitest/config';

// unplugin-swc типизирован по корневому vite фронта (rolldown), у vitest свой vite —
// объект плагина тот же, расходятся только типы
type VitestPlugin = NonNullable<ViteUserConfig['plugins']>[number];

/** Интеграционные тесты: настоящие сервисы на отдельной базе Postgres (см. test/README.md). */
export default defineConfig({
  // swc вместо esbuild: Nest нужен emitDecoratorMetadata, esbuild его не умеет
  plugins: [swc.vite({ module: { type: 'es6' } }) as VitestPlugin],
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
