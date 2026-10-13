#!/usr/bin/env bash
set -euo pipefail

# Первый запуск проекта: зависимости, .env, миграции, сиды (мышцы, суставы, платформенный админ),
# справочник упражнений. Повторный запуск безопасен: .env не перезаписывается, миграции и сиды идемпотентны.
# Запуск: ./setup.sh [--no-images] [--build] [--skip-install]
#   --no-images     справочник без скачивания картинок (быстро, сеть не нужна)
#   --build         в конце собрать сервер и фронт (для сервера; локально хватит yarn dev)
#   --skip-install  не запускать yarn install

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER="$ROOT/apps/server"
FRONT="$ROOT/apps/frontend"

BUILD=false
INSTALL=true
CONTENT_ARGS=()

for arg in "$@"; do
  case "$arg" in
    --no-images) CONTENT_ARGS+=("--no-images") ;;
    --build) BUILD=true ;;
    --skip-install) INSTALL=false ;;
    -h | --help)
      sed -n '4,9p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "❌ Неизвестный флаг: $arg (см. ./setup.sh --help)" >&2
      exit 1
      ;;
  esac
done

# ── Окружение ───────────────────────────────────────────────────────────────

echo "🔎 Проверяю окружение..."
for tool in node yarn; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "❌ Не найден $tool — установите и запустите скрипт снова" >&2
    exit 1
  fi
done

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
# Vite 8 на фронте требует Node.js 22
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "❌ Нужен Node.js 22+, установлен $(node -v)" >&2
  exit 1
fi

# ── Зависимости ─────────────────────────────────────────────────────────────

cd "$ROOT"
if [ "$INSTALL" = true ]; then
  echo "📦 Устанавливаю зависимости..."
  yarn install
fi

# ── Файлы .env ──────────────────────────────────────────────────────────────

# Локально фронт берёт адрес API из закоммиченного .env.development; адрес прода нужен только сборке —
# отдельный .env.production явно показывает, что именно его заполнить перед yarn build
if [ ! -f "$FRONT/.env.production" ]; then
  cp "$FRONT/.env.example" "$FRONT/.env.production"
  echo "📝 Создан apps/frontend/.env.production из примера — укажите в нём VITE_API_URL прода"
fi

if [ ! -f "$SERVER/.env" ]; then
  cp "$SERVER/.env.example" "$SERVER/.env"
  echo "📝 Создан apps/server/.env из примера"
fi

cd "$SERVER"

# Значения читаем через dotenv, как их прочитает само приложение: кавычки и пробелы в .env разбираются одинаково
node - <<'NODE'
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');

let text = fs.readFileSync('.env', 'utf8');
const example = dotenv.parse(fs.readFileSync('.env.example', 'utf8'));
let env = dotenv.parse(text);

if (!env.JWT_SECRET || env.JWT_SECRET === example.JWT_SECRET) {
  const line = `JWT_SECRET="${crypto.randomBytes(32).toString('hex')}"`;
  text = /^JWT_SECRET=.*$/m.test(text)
    ? text.replace(/^JWT_SECRET=.*$/m, line)
    : `${text.trimEnd()}\n${line}\n`;
  fs.writeFileSync('.env', text);
  env = dotenv.parse(text);
  console.log('🔑 JWT_SECRET сгенерирован и записан в apps/server/.env');
}

const errors = [];
const warnings = [];

if (!env.DATABASE_URL || env.DATABASE_URL === example.DATABASE_URL) {
  errors.push('DATABASE_URL — укажите строку подключения к своей базе PostgreSQL');
}

const adminPassword = env.PLATFORM_ADMIN_PASSWORD ?? '';
if (!env.PLATFORM_ADMIN_EMAIL || !adminPassword) {
  warnings.push('PLATFORM_ADMIN_EMAIL / PLATFORM_ADMIN_PASSWORD не заданы — платформенный админ создан не будет');
} else if (adminPassword.length < 8) {
  // Сид не меняет пароль при повторном запуске, поэтому слабый пароль из примера останется навсегда
  errors.push('PLATFORM_ADMIN_PASSWORD — задайте пароль не короче 8 символов');
}

for (const key of ['RESEND_API_KEY', 'MAIL_FROM']) {
  if (!env[key] || env[key] === example[key]) {
    warnings.push(`${key} — значение из примера, письма отправляться не будут`);
  }
}
if (!(env.TG_BOT_TOKEN && env.TG_BOT_NAME) && !(env.MAX_BOT_TOKEN && env.MAX_BOT_NAME)) {
  warnings.push('Токены ботов (TG_BOT_* / MAX_BOT_*) не заданы — ни один бот не подключится');
}

for (const warning of warnings) console.log(`⚠️  ${warning}`);
if (errors.length) {
  console.error('\n❌ Заполните apps/server/.env и запустите скрипт снова:');
  for (const error of errors) console.error(`   • ${error}`);
  process.exit(1);
}
NODE

# ── База данных ─────────────────────────────────────────────────────────────

echo "🗄️ Применяю миграции..."
npx prisma migrate deploy

# content.sh сам генерирует клиент Prisma, запускает сид и импортирует справочник
bash ./content.sh ${CONTENT_ARGS[@]+"${CONTENT_ARGS[@]}"}

# ── Сборка ──────────────────────────────────────────────────────────────────

cd "$ROOT"
if [ "$BUILD" = true ]; then
  echo "🏗️ Собираю сервер и фронт..."
  yarn build
  echo "✅ Готово. Запуск сервера: (cd apps/server && yarn start:prod)"
else
  echo "✅ Готово. Запуск для разработки: yarn dev"
fi
