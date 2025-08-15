@echo off
echo 🔨 Building server...

REM Clean previous build
if exist dist (
    echo 🧹 Cleaning previous build...
    rmdir /s /q dist
)

REM Install dependencies if needed
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
)

REM Build the server
echo ⚙️  Compiling TypeScript...
npx tsc

REM Verify build output
if exist dist\index.js (
    echo ✅ Build successful! dist\index.js created.
    echo 📁 Build contents:
    dir dist
) else (
    echo ❌ Build failed! dist\index.js not found.
    exit /b 1
)

echo 🚀 Server build completed successfully!
