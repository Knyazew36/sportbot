import { defineConfig } from 'orval'

// Источник — Swagger запущенного сервера. orval генерирует только функции и типы в общий пакет
// (packages/api/generated), хуки и ключи react-query пишутся руками в packages/api/entities/*
const API_URL = process.env.VITE_API_URL ?? 'http://localhost:4003/api'

export default defineConfig({
  api: {
    input: `${API_URL}/docs-json`,
    output: {
      mode: 'tags-split',
      target: '../../packages/api/generated',
      schemas: '../../packages/api/generated/model',
      client: 'axios-functions',
      httpClient: 'axios',
      clean: true,
      override: {
        mutator: { path: '../../packages/api/client/orval-mutator.ts', name: 'customInstance' },
      },
    },
  },
})
