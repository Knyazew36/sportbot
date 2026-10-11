#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

git pull
yarn
chmod +x apps/server/deploy.sh

(cd apps/server && ./deploy.sh)
(cd apps/front && yarn build)

pm2 restart all
