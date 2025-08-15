@echo off
echo 🚀 Testing production build process...

REM Clean previous builds
echo 🧹 Cleaning previous builds...
if exist client\dist rmdir /s /q client\dist
if exist server\dist rmdir /s /q server\dist

REM Build client
echo 🔨 Building client...
cd client
npm run build
if errorlevel 1 (
    echo ❌ Client build failed
    exit /b 1
)
cd ..
echo ✅ Client build successful

REM Build server
echo 🔨 Building server...
cd server
npm install
npx tsc
if errorlevel 1 (
    echo ❌ Server build failed
    exit /b 1
)
echo ✅ Server build successful

REM Copy client build to server dist directory for runtime access
echo 📁 Copying client build to server/dist/client...
if not exist dist\client mkdir dist\client
xcopy ..\client\dist\* dist\client\ /E /I /Y
if errorlevel 1 (
    echo ❌ Failed to copy client files
    exit /b 1
)

REM Verify client files are accessible from server
if exist dist\client\index.html (
    echo ✅ Client files copied successfully to server/dist/client
    echo 📁 Server dist/client contents:
    dir dist\client
) else (
    echo ❌ Client files not found in server/dist/client
    exit /b 1
)

cd ..
echo 🎉 Production build test completed successfully!
echo 🚀 You can now test the production server with: cd server && npm start
