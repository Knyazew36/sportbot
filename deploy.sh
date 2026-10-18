#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

git pull
yarn install --frozen-lockfile
chmod +x apps/server/deploy.sh

# Общий контракт рендера: сервер берёт его типы и код из dist, а postinstall при
# «Already up-to-date» не срабатывает — собираем явно до сервера
(cd packages/render-contract && yarn build)

# Сервер: миграции + сборка. Фронт: статика в apps/frontend/dist, её отдаёт nginx
(cd apps/server && ./deploy.sh)
(cd apps/frontend && yarn build)
# Рендер видео: бандл композиций для воркера (apps/server/src/main-render.ts).
# Первый раз воркер заводится вручную: cd apps/server && pm2 start dist/src/main-render.js --name render
(cd apps/video && yarn bundle)
# ffmpeg с альфой для HEVC (iPhone): собирается один раз, дальше только проверка. Не собрался — сайт
# всё равно выкатываем, падать будет лишь этот формат (ошибка в логе воркера)
bash apps/server/scripts/build-ffmpeg-alpha.sh || echo "⚠️ ffmpeg с альфой не собран — формат HEVC для iPhone недоступен"

pm2 restart all
