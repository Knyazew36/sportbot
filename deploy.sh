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

pm2 restart all
