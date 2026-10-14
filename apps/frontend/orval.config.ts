import { defineConfig } from 'orval'

// Источник — Swagger запущенного сервера. orval генерирует только функции и типы (shared/api/generated),
// хуки и ключи react-query пишутся руками в entities/*
const API_URL = process.env.VITE_API_URL ?? 'http://localhost:4003/api'

export default defineConfig({
  api: {
    input: `${API_URL}/docs-json`,
    output: {
      mode: 'tags-split',
      target: 'src/shared/api/generated',
      schemas: 'src/shared/api/generated/model',
      client: 'axios-functions',
      httpClient: 'axios',
      clean: true,
      override: {
        mutator: { path: 'src/shared/api/model/orval-mutator.ts', name: 'customInstance' },
      },
    },
  },
})
