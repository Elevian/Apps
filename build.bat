@echo off
echo 🚀 Starting build process...

REM Set environment variables
set NODE_OPTIONS=--max-old-space-size=4096
set NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
set PNPM_HOME=%USERPROFILE%\.local\share\pnpm
set PATH=%PNPM_HOME%;%PATH%

REM Install pnpm if not available
where pnpm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 📦 Installing pnpm...
    npm install -g pnpm@8
)

REM Verify pnpm version
echo 🔍 pnpm version:
pnpm --version

REM Clear caches
echo 🧹 Clearing caches...
pnpm store prune

REM Install dependencies
echo 📥 Installing dependencies...
pnpm install --frozen-lockfile --prefer-offline=false --network-timeout=300000

REM Build the application
echo 🔨 Building application...
pnpm run build

echo ✅ Build completed successfully!
pause
