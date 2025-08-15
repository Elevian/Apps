#!/bin/bash

# Build script for Render deployment with retry logic
set -e

echo "🚀 Starting build process..."

# Set environment variables
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

# Clear caches
echo "🧹 Clearing caches..."
pnpm store prune || true

# Install dependencies with retry logic
echo "📥 Installing dependencies..."
retry 3 pnpm install --frozen-lockfile --prefer-offline=false --network-timeout=300000

# Build the application
echo "🔨 Building application..."
retry 2 pnpm run build

echo "✅ Build completed successfully!"
