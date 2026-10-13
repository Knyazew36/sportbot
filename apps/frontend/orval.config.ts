import { defineConfig } from 'orval'

// Источник — Swagger запущенного сервера. Хуки проектных сущностей генерируются в shared/api/generated;
// ядро шаблона (auth, сессия, организации) описано руками в entities/*
const API_URL = process.env.VITE_API_URL ?? 'http://localhost:4003/api'

export default defineConfig({
  api: {
    input: `${API_URL}/docs-json`,
    output: {
      mode: 'tags-split',
      target: 'src/shared/api/generated',
      schemas: 'src/shared/api/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      clean: true,
      override: {
        mutator: { path: 'src/shared/api/model/orval-mutator.ts', name: 'customInstance' },
      },
    },
  },
})
