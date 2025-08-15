# Render Deployment Guide

## 🚀 Quick Deploy

This project is configured for automatic deployment on Render.com.

### Prerequisites
- GitHub repository connected to Render
- Node.js 18+ environment
- pnpm 8+ package manager

## 📋 Deployment Steps

### 1. Connect to Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the main branch

### 2. Configure Service
- **Name**: `gutenberg-characters` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave empty (root of repository)

### 3. Build & Start Commands
The `render.yaml` file automatically configures these, but you can also set them manually:

**Build Command:**
```bash
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

if ! command -v pnpm &> /dev/null; then
  npm install -g pnpm@8
fi

pnpm store prune || true
rm -rf client/dist server/dist
pnpm install --frozen-lockfile --prefer-offline=false --network-timeout=300000
pnpm run build --workspace=client
pnpm run build --workspace=server
```

**Start Command:**
```bash
cd server && pnpm start
```

### 4. Environment Variables
These are automatically set via `render.yaml`:
- `NODE_ENV=production`
- `PORT=10000`
- `NPM_CONFIG_REGISTRY=https://registry.npmjs.org/`
- `PNPM_HOME=$HOME/.local/share/pnpm`
- `NODE_OPTIONS=--max-old-space-size=4096`

### 5. Deploy
Click "Create Web Service" and wait for the build to complete.

## 🔧 Local Testing

### Test Production Build Locally
```bash
# Make build script executable
chmod +x build-production.sh

# Run production build
./build-production.sh

# Start production server
pnpm start
```

### Test Windows Build
```bash
# Run Windows build script
build.bat
```

## 📁 File Structure After Build

```
your-project/
├── client/
│   └── dist/          # Built frontend files
├── server/
│   └── dist/          # Built backend files
└── ... (other files)
```

## 🌐 Production URLs

- **API Endpoints**: `https://your-app-name.onrender.com/api/*`
- **Health Check**: `https://your-app-name.onrender.com/health`
- **Frontend**: `https://your-app-name.onrender.com/`

## 🔍 Troubleshooting

### Build Failures
1. Check Render build logs for specific errors
2. Verify all configuration files are committed
3. Ensure Node.js version compatibility
4. Check network access to npm registry

### Runtime Errors
1. Verify environment variables are set
2. Check server logs for error details
3. Ensure PORT is accessible
4. Verify CORS configuration

### Common Issues
- **Port conflicts**: Ensure PORT environment variable is set
- **Missing dependencies**: Check package.json and pnpm-lock.yaml
- **Build timeout**: Increase build timeout in Render settings
- **Memory issues**: Use paid plan for more memory

## 📊 Monitoring

### Health Checks
- `/health` - Basic health check
- `/api/health` - API health check

### Logs
- View real-time logs in Render dashboard
- Check build logs for deployment issues
- Monitor runtime logs for errors

## 🔄 Auto-Deploy

The service is configured to automatically deploy when you push to the main branch. To disable:
1. Go to service settings in Render dashboard
2. Toggle "Auto-Deploy" off

## 📝 Customization

### Change App Name
Update `render.yaml`:
```yaml
name: your-custom-name
```

### Add Custom Environment Variables
Add to `render.yaml`:
```yaml
envVars:
  - key: CUSTOM_VAR
    value: custom_value
```

### Modify Build Process
Edit the `buildCommand` section in `render.yaml` to customize the build process.

## 🎯 Success Indicators

✅ Build completes without errors  
✅ Service starts successfully  
✅ Health checks pass  
✅ API endpoints respond  
✅ Frontend loads correctly  
✅ No runtime errors in logs  

## 📞 Support

If you encounter issues:
1. Check Render documentation
2. Review build and runtime logs
3. Verify configuration files
4. Test locally before deploying
