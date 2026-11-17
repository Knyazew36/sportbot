// Пакет без "type": "module" (сервер берёт CJS-сборку), поэтому ESM-сборке нужен свой package.json
import { writeFileSync } from 'node:fs'

writeFileSync(new URL('../dist/esm/package.json', import.meta.url), `${JSON.stringify({ type: 'module' })}\n`)
