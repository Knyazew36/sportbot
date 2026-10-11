#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

git pull
yarn
# yarn workspace @repo/emails build
chmod +x apps/server/deploy.sh apps/frontend/deploy.sh apps/landing/deploy.sh

(cd apps/server && ./deploy.sh)
(cd apps/frontend && ./deploy.sh)
# (cd apps/landing && ./deploy.sh)

pm2 restart all
