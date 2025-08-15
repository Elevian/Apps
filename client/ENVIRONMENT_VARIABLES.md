# Environment Variables

This document describes the environment variables needed for the client application.

## Required Environment Variables

### `VITE_API_URL`
- **Description**: The base URL for your backend API server
- **Example**: `https://your-app-name.onrender.com`
- **Default**: `/api` (relative to current domain)
- **Usage**: Used for all API calls to the backend server

## Optional Environment Variables

### Ollama Configuration (Local LLM)
- **`VITE_OLLAMA_URL`**: Ollama server URL (default: `http://localhost:11434`)
- **`VITE_OLLAMA_MODEL`**: Default model name (default: `llama2`)
- **`VITE_OLLAMA_TIMEOUT`**: Request timeout in milliseconds (default: `30000`)
- **`VITE_OLLAMA_MAX_RETRIES`**: Maximum retry attempts (default: `2`)

### Groq Configuration (Cloud LLM)
- **`VITE_GROQ_API_KEY`**: Your Groq API key for cloud-based character analysis
- **`VITE_GROQ_URL`**: Groq API endpoint (default: `https://api.groq.com/openai/v1`)

## Setting Environment Variables

### For Development
Create a `.env.local` file in the client directory:
```bash
VITE_API_URL=http://localhost:10000
VITE_OLLAMA_URL=http://localhost:11434
```

### For Production (Render)
Set these in your Render dashboard under Environment Variables:
- `VITE_API_URL`: Your Render deployment URL
- Any other variables you want to customize

## Notes
- All environment variables must start with `VITE_` to be accessible in the browser
- The application will use sensible defaults if variables are not set
- Environment variables are embedded at build time, so changes require a rebuild
