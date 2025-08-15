@echo off
echo 🚀 Testing full build and serve process...

REM Clean previous builds
echo 🧹 Cleaning previous builds...
if exist client\dist rmdir /s /q client\dist
if exist server\dist rmdir /s /q server\dist
if exist server\client-dist rmdir /s /q server\client-dist

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

REM Copy client files to server directory
echo 📁 Copying client files to server directory...
xcopy ..\client\dist client-dist\ /E /I /Y
if errorlevel 1 (
    echo ❌ Failed to copy client files
    exit /b 1
)
echo ✅ Client files copied successfully

REM Verify client files are accessible
if exist client-dist\index.html (
    echo ✅ Client files accessible at server\client-dist
    echo 📁 Client files:
    dir client-dist
) else (
    echo ❌ Client files not found in server\client-dist
    exit /b 1
)

cd ..
echo 🎉 Full build test completed successfully!
echo 🚀 You can now test the server with: cd server && npm start
