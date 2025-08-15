#!/bin/bash

# Production build script for Render deployment
set -e

echo "🚀 Starting production build process..."

# Set environment variables
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

# Function to retry commands
retry() {
    local -r -i max_attempts="$1"; shift
    local -r cmd="$@"
    local -i attempt_num=1

    until $cmd
    do
        if ((attempt_num==max_attempts))
        then
            echo "❌ Attempt $attempt_num failed and there are no more attempts left!"
            return 1
        else
            echo "⚠️  Attempt $attempt_num failed! Trying again in $((attempt_num * 5)) seconds..."
            sleep $((attempt_num * 5))
            ((attempt_num++))
        fi
    done
}

# Install pnpm if not available
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm@8
fi

# Verify pnpm version
echo "🔍 pnpm version: $(pnpm --version)"

# Clear caches and old builds
echo "🧹 Clearing caches and old builds..."
pnpm store prune || true
rm -rf client/dist server/dist

# Install dependencies with retry logic
echo "📥 Installing dependencies..."
retry 3 pnpm install --frozen-lockfile --prefer-offline=false --network-timeout=300000

# Build client
echo "🔨 Building client..."
retry 2 pnpm run build --workspace=client

# Build server
echo "🔨 Building server..."
retry 2 pnpm run build --workspace=server

# Verify builds
echo "✅ Verifying builds..."
if [ ! -d "client/dist" ]; then
    echo "❌ Client build failed - dist directory not found"
    exit 1
fi

if [ ! -d "server/dist" ]; then
    echo "❌ Server build failed - dist directory not found"
    exit 1
fi

echo "✅ Production build completed successfully!"
echo "📁 Client build: $(ls -la client/dist | wc -l) files"
echo "📁 Server build: $(ls -la server/dist | wc -l) files"
