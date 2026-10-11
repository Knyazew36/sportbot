#!/bin/bash
set -e

echo "🚀 Deploying to PRODUCTION environment..."

{


    echo "📦 Running Prisma migrations for production..."
    npx prisma migrate deploy

    echo "🔧 Generating Prisma client for production..."
    npx prisma generate
    
    echo "🏗️ Building application..."
    yarn build

    echo "✅ Server build completed successfully!"
}
