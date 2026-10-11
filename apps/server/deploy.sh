#!/bin/bash
set -e

echo "🚀 Deploying to PRODUCTION environment..."

echo "📦 Running Prisma migrations for production..."
npx prisma migrate deploy

# Клиент Prisma генерируется в prebuild (см. package.json)
echo "🏗️ Building application..."
yarn build

echo "✅ Server build completed successfully!"
