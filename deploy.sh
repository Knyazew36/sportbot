#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

git pull
yarn install --frozen-lockfile
chmod +x apps/server/deploy.sh

# Сервер: миграции + сборка. Фронт: статика в apps/frontend/dist, её отдаёт nginx
(cd apps/server && ./deploy.sh)
(cd apps/frontend && yarn build)
# Рендер видео: бандл композиций для воркера (apps/server/src/main-render.ts).
# Первый раз воркер заводится вручную: cd apps/server && pm2 start dist/src/main-render.js --name render
(cd apps/video && yarn bundle)

pm2 restart all
