#!/bin/bash

echo "🔨 Building server..."

# Clean previous build
if [ -d "dist" ]; then
    echo "🧹 Cleaning previous build..."
    rm -rf dist
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the server
echo "⚙️  Compiling TypeScript..."
npx tsc

# Verify build output
if [ -f "dist/index.js" ]; then
    echo "✅ Build successful! dist/index.js created."
    echo "📁 Build contents:"
    ls -la dist/
else
    echo "❌ Build failed! dist/index.js not found."
    exit 1
fi

echo "🚀 Server build completed successfully!"
