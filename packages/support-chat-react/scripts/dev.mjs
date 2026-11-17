// Два наблюдателя разом: tsc для JS и типов, tailwind для dist/styles.css. Упал один — гасим и другой
import { spawn } from 'node:child_process'

const commands = [
  'tsc -p tsconfig.build.json --watch --preserveWatchOutput',
  'tailwindcss -i src/styles.css -o dist/styles.css --watch',
]

const children = commands.map(command => spawn(command, { shell: true, stdio: 'inherit' }))

const stop = code => {
  for (const child of children) child.kill()
  process.exit(code ?? 0)
}

for (const child of children) child.on('exit', stop)
process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
