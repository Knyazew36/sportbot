import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // @sportbot/render-contract держит zod 4.5.4 ради Remotion; во фронте схемы должны жить в одном
    // экземпляре zod с формами, иначе zodResolver и instanceof не узнают их
    dedupe: ['zod', 'react'],
  },
  // Порт фиксирован: он в списке разрешённых origin CORS на сервере
  server: { port: 5173, strictPort: true },
})
