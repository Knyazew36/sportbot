// Картинки для Telegram из HTML-шаблонов telegram/*.html: node scripts/telegram.mjs [имя-шаблона]
// Рендерит установленный Chrome без окна. Путь к нему — CHROME_PATH, иначе стандартный для ОС
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const out = new URL('export/telegram/', root)
mkdirSync(out, { recursive: true })

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean)
const chrome = CHROME_CANDIDATES.find(p => existsSync(p))
if (!chrome) throw new Error('Chrome не найден — укажи CHROME_PATH')

// [шаблон, картинка, ширина, высота]
const targets = [
  // BotFather → Edit Bot → Edit Description Picture: «Что умеет этот бот?» в пустом чате
  ['card.html?v=description', 'description-640x360.png', 640, 360],
  // BotFather → /newapp и Main Mini App: обложка приложения
  ['card.html?v=cover', 'miniapp-cover-640x360.png', 640, 360],
  // Фото к приветствию /start
  ['card.html?v=welcome', 'welcome-1280x720.png', 1280, 720],
  // Превью Main Mini App и посты в канал: вертикальные экраны
  ['promo-1-hero.html', 'promo-1-hero.png', 1080, 1920],
  // Слайды с настоящими скриншотами Mini App (shots/ — снято с демо-данными, см. apps/server/prisma/demo-promo.ts)
  ['promo.html?s=today', 'promo-2-today.png', 1080, 1920],
  ['promo.html?s=set', 'promo-3-set.png', 1080, 1920],
  ['promo.html?s=rest', 'promo-4-rest.png', 1080, 1920],
  ['promo-4-chat.html', 'promo-5-chat.png', 1080, 1920],
  ['promo.html?s=progress', 'promo-6-progress.png', 1080, 1920],
  ['promo.html?s=finish', 'promo-7-finish.png', 1080, 1920],
  ['promo.html?s=attendance', 'promo-8-attendance.png', 1080, 1920],
]

const only = process.argv[2]
for (const [src, name, width, height] of targets) {
  if (only && !src.includes(only) && !name.includes(only)) continue
  const page = new URL(`telegram/${src}`, root).href
  const file = fileURLToPath(new URL(name, out))
  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--allow-file-access-from-files',
    '--force-device-scale-factor=1',
    // Ждём шрифты: без бюджета Chrome снимает кадр до их загрузки
    '--virtual-time-budget=4000',
    `--window-size=${width},${height}`,
    `--screenshot=${file}`,
    page,
  ], { stdio: 'ignore' })
  console.log(`${name} ${width}×${height}`)
}
