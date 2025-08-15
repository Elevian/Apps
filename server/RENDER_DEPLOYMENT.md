# Render Deployment Guide for Server

This guide explains how to properly deploy the server to Render.com to avoid the `MODULE_NOT_FOUND` error.

## ✅ What We Fixed

1. **Updated `tsconfig.json`** - Fixed TypeScript compilation settings
2. **Updated `package.json`** - Added proper build scripts
3. **Created build scripts** - `build.sh` and `build.bat` for reliable builds
4. **Verified local build** - Confirmed `dist/index.js` is created correctly

## 🚀 Render Configuration

### Build Command
Use this **simple build command** in Render:

```bash
chmod +x build.sh && ./build.sh
```

**Alternative (if build.sh fails):**
```bash
npm install && npx tsc
```

### Start Command
```bash
npm start
```

## 📁 File Structure After Build

The build should create this structure:
```
server/
├── dist/
│   ├── index.js          ← Main entry point
│   ├── routes/           ← Compiled route files
│   └── services/         ← Compiled service files
├── src/                  ← Source files
├── package.json          ← Dependencies and scripts
├── tsconfig.json         ← TypeScript configuration
└── build.sh              ← Build script
```

## 🔍 Troubleshooting

### If Build Still Fails

1. **Check Render logs** for specific error messages
2. **Verify Node.js version** - should be 18+ (already set in package.json)
3. **Check file permissions** - build.sh should be executable

### If Start Command Fails

1. **Verify `dist/index.js` exists** after build
2. **Check file paths** in the compiled JavaScript
3. **Ensure all dependencies** are installed

## 🧪 Testing Locally

Before deploying to Render, test locally:

```bash
# Windows
.\build.bat
npm start

# Linux/Mac
chmod +x build.sh
./build.sh
npm start
```

**Expected result**: Server starts on http://localhost:10000

## 📋 Environment Variables

Set these in Render dashboard:

- **`NODE_ENV`**: `production`
- **`PORT`**: `10000` (or let Render set it automatically)

## 🎯 Key Points

1. **Build command must create `dist/index.js`**
2. **Start command must point to `dist/index.js`**
3. **TypeScript compilation must succeed**
4. **All dependencies must be installed**

## ✅ Success Indicators

- ✅ Build completes without errors
- ✅ `dist/index.js` file exists
- ✅ Server starts successfully
- ✅ Health check `/health` responds
- ✅ No `MODULE_NOT_FOUND` errors

## 🚨 Common Issues

1. **Build command too complex** - Use simple `npx tsc`
2. **Missing dependencies** - Ensure `npm install` runs
3. **TypeScript errors** - Check `tsconfig.json` configuration
4. **File permissions** - Make build script executable

## 📞 If Still Having Issues

1. Check Render build logs for specific errors
2. Verify the build command output shows `dist/index.js` created
3. Ensure the start command path matches the actual build output
4. Test the exact build command locally first
