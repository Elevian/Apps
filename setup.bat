@echo off
REM 🚀 Gutenberg Character Analysis - Quick Setup (Windows)
REM Gets you analyzing books in under 5 minutes!

echo 📚 Setting up Gutenberg Character Analysis...
echo.

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js 18+ first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected
echo.

REM Navigate to client directory
if not exist "client" (
    echo ❌ Client directory not found. Run this script from the project root.
    pause
    exit /b 1
)

cd client

echo 📦 Installing dependencies...
echo    Using npm...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.

REM Check for Ollama (optional)
ollama --version >nul 2>&1
if %errorlevel% equ 0 (
    echo 🤖 Ollama detected - AI features enabled
) else (
    echo 💡 Ollama not found - AI features will use fallback ^(optional^)
    echo    Install from: https://ollama.ai/ for enhanced character extraction
)

echo.
echo 🎉 Setup complete! Starting development server...
echo.
echo 📖 Try these sample books:
echo    • 84 ^(Frankenstein^)
echo    • 1342 ^(Pride ^& Prejudice^)
echo    • 2701 ^(Moby Dick^)
echo.

REM Start development server
call npm run dev
