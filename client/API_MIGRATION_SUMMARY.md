# API Migration Summary

This document summarizes the changes made to migrate from hardcoded API URLs to environment variables.

## Changes Made

### 1. Created Centralized API Configuration
- **File**: `src/lib/config/api.ts`
- **Purpose**: Centralizes all API endpoints and configuration
- **Features**: Environment variable support with sensible defaults

### 2. Updated API Files
- **`src/lib/api/gutenberg.ts`**: Now uses `ENDPOINTS` from config
- **`src/lib/analysis/ollama-fallback.ts`**: Uses `OLLAMA_CONFIG` from config
- **`src/lib/analysis/character-extraction.ts`**: Uses `OLLAMA_CONFIG` from config
- **`src/lib/security/secure-network.ts`**: Uses `OLLAMA_CONFIG` from config

### 3. Updated Components
- **`src/components/ui/reading-guide.tsx`**: Uses `OLLAMA_CONFIG` for Ollama API calls

### 4. Updated Build Configuration
- **`vite.config.ts`**: Proxy now uses `VITE_API_URL` environment variable

## Environment Variables Required

### Required for Production
- **`VITE_API_URL`**: Your backend server URL (e.g., `https://your-app-name.onrender.com`)

### Optional (with sensible defaults)
- **`VITE_OLLAMA_URL`**: Ollama server URL (default: `http://localhost:11434`)
- **`VITE_OLLAMA_MODEL`**: Default model (default: `llama2`)
- **`VITE_OLLAMA_TIMEOUT`**: Request timeout (default: `30000`)
- **`VITE_OLLAMA_MAX_RETRIES`**: Max retries (default: `2`)
- **`VITE_GROQ_API_KEY`**: Groq API key (default: empty - disabled)
- **`VITE_GROQ_URL`**: Groq API endpoint (default: `https://api.groq.com/openai/v1`)

## How It Works

1. **Environment Variables**: Set in Render dashboard or `.env.local` file
2. **Configuration**: `src/lib/config/api.ts` reads environment variables
3. **API Calls**: All components use centralized configuration
4. **Fallbacks**: Sensible defaults if environment variables are not set

## Benefits

- ✅ **No hardcoded URLs** in source code
- ✅ **Environment-specific configuration** (dev vs production)
- ✅ **Centralized management** of all API endpoints
- ✅ **Easy deployment** to different environments
- ✅ **Secure** - no secrets in source code

## Deployment

### Render.com
Set these environment variables in your Render dashboard:
- `VITE_API_URL`: Your Render deployment URL
- Any other variables you want to customize

### Local Development
Create `.env.local` in the client directory:
```bash
VITE_API_URL=http://localhost:10000
VITE_OLLAMA_URL=http://localhost:11434
```

## Testing

After deployment:
1. Verify the app loads without errors
2. Check that API calls work (character analysis, book fetching)
3. Verify Ollama integration works (if configured)
4. Check browser console for any configuration warnings
