/**
 * API Configuration
 * All API endpoints are configured here using environment variables
 */

// Main API base URL for the backend server
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Ollama API configuration for local LLM
export const OLLAMA_CONFIG = {
  baseUrl: import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434',
  defaultModel: import.meta.env.VITE_OLLAMA_MODEL || 'llama2',
  timeout: parseInt(import.meta.env.VITE_OLLAMA_TIMEOUT || '30000'),
  maxRetries: parseInt(import.meta.env.VITE_OLLAMA_MAX_RETRIES || '2')
}

// Groq API configuration
export const GROQ_CONFIG = {
  apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
  baseUrl: import.meta.env.VITE_GROQ_URL || 'https://api.groq.com/openai/v1'
}

// Environment validation
export function validateEnvironment(): void {
  if (!import.meta.env.VITE_API_URL) {
    console.warn('VITE_API_URL not set, using default /api endpoint')
  }
  
  if (!import.meta.env.VITE_OLLAMA_URL) {
    console.warn('VITE_OLLAMA_URL not set, using default localhost:11434')
  }
  
  if (!import.meta.env.VITE_GROQ_API_KEY) {
    console.warn('VITE_GROQ_API_KEY not set, Groq features will be disabled')
  }
}

// Export individual endpoints for convenience
export const ENDPOINTS = {
  gutenberg: {
    resolve: (id: string) => `${API_BASE_URL}/gutenberg/resolve/${id}`,
    text: (id: string) => `${API_BASE_URL}/gutenberg/text/${id}`,
    preview: (id: string) => `${API_BASE_URL}/gutenberg/text/${id}/preview`
  },
  analysis: {
    characters: `${API_BASE_URL}/analyze/characters`,
    health: `${API_BASE_URL}/analyze/health`
  },
  ollama: {
    tags: `${OLLAMA_CONFIG.baseUrl}/api/tags`,
    generate: `${OLLAMA_CONFIG.baseUrl}/api/generate`
  }
}
