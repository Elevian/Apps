@echo off
echo 🚀 Starting build process...

REM Set environment variables
set NODE_OPTIONS=--max-old-space-size=4096
set NPM_CONFIG_REGISTRY=https://registry.npmjs.org/

REM Install dependencies
echo 📥 Installing dependencies...
npm install

REM Build the application
echo 🔨 Building application...
npm run build

echo ✅ Build completed successfully!
pause
