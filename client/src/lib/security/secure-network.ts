/**
 * Privacy-aware network utilities
 * Wraps network calls with privacy checks and local-only mode enforcement
 */

import { privacyManager, type NetworkRequest } from './privacy-manager'
import { toast } from 'sonner'
import { OLLAMA_CONFIG } from '../config/api'

export interface SecureRequestOptions extends RequestInit {
  requestInfo?: Omit<NetworkRequest, 'url'>
  skipPrivacyCheck?: boolean
  showUserPrompt?: boolean
}

/**
 * Privacy-aware fetch wrapper
 */
export async function secureFetch(
  url: string, 
  options: SecureRequestOptions = {}
): Promise<Response> {
  const {
    requestInfo = { type: 'external', purpose: 'Unknown', required: false },
    skipPrivacyCheck = false,
    showUserPrompt = false,
    ...fetchOptions
  } = options

  const request: NetworkRequest = { ...requestInfo, url }
  
  // Skip privacy check if explicitly requested (for critical operations)
  if (!skipPrivacyCheck) {
    const allowed = await privacyManager.requestNetworkPermission(request)
    if (!allowed) {
      const error = new Error(`Network request blocked by privacy settings: ${request.purpose}`)
      ;(error as any).code = 'PRIVACY_BLOCKED'
      throw error
    }
  }

  // Show user notification if requested
  if (showUserPrompt) {
    toast.info(`Connecting to ${getDomainFromUrl(url)}...`)
  }
  
  try {
    const response = await fetch(url, fetchOptions)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response
  } catch (error) {
    // Handle network errors gracefully
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      const networkError = new Error('Network connection failed. Check your internet connection.')
      ;(networkError as any).code = 'NETWORK_ERROR'
      throw networkError
    }
    
    throw error
  }
}

/**
 * Secure Project Gutenberg API calls
 */
export const gutenbergAPI = {
  /**
   * Fetch book metadata
   */
  async getBookInfo(bookId: string): Promise<any> {
    const url = `https://gutendx.com/books/${bookId}`
    
    return secureFetch(url, {
      requestInfo: {
        type: 'gutenberg',
        purpose: 'Fetch book metadata',
        required: true
      },
      showUserPrompt: true
    }).then(response => response.json())
  },

  /**
   * Download book text
   */
  async downloadBookText(bookId: string, format: string = 'txt'): Promise<string> {
    // Try multiple mirrors for reliability
    const mirrors = [
      `https://www.gutenberg.org/files/${bookId}/${bookId}-0.txt`,
      `https://www.gutenberg.org/cache/epub/${bookId}/pg${bookId}.txt`,
      `https://gutenberg.org/files/${bookId}/${bookId}.txt`
    ]

    let lastError: Error | null = null

    for (const url of mirrors) {
      try {
        const response = await secureFetch(url, {
          requestInfo: {
            type: 'gutenberg',
            purpose: `Download book ${bookId} text`,
            required: true
          },
          showUserPrompt: true
        })
        
        return await response.text()
      } catch (error) {
        lastError = error as Error
        console.warn(`Failed to download from ${url}:`, error)
        continue
      }
    }

    throw lastError || new Error('All download mirrors failed')
  },

  /**
   * Search books (if search functionality is needed)
   */
  async searchBooks(query: string, limit: number = 20): Promise<any> {
    const url = `https://gutendx.com/books?search=${encodeURIComponent(query)}&page_size=${limit}`
    
    return secureFetch(url, {
      requestInfo: {
        type: 'gutenberg',
        purpose: 'Search Project Gutenberg catalog',
        required: false
      }
    }).then(response => response.json())
  }
}

/**
 * Secure Ollama API calls (localhost only)
 */
export const ollamaAPI = {
  /**
   * Check if Ollama is available
   */
  async isAvailable(baseUrl: string = OLLAMA_CONFIG.baseUrl): Promise<boolean> {
    try {
      await secureFetch(`${baseUrl}/api/tags`, {
        requestInfo: {
          type: 'ollama',
          purpose: 'Check Ollama availability',
          required: false
        },
        headers: {
          'Accept': 'application/json'
        }
      })
      return true
    } catch (error) {
      return false
    }
  },

  /**
   * List available models
   */
  async listModels(baseUrl: string = OLLAMA_CONFIG.baseUrl): Promise<string[]> {
    const response = await secureFetch(`${baseUrl}/api/tags`, {
      requestInfo: {
        type: 'ollama',
        purpose: 'List available LLM models',
        required: false
      },
      headers: {
        'Accept': 'application/json'
      }
    })

    const data = await response.json()
    return data.models?.map((model: any) => model.name) || []
  },

  /**
   * Generate completion
   */
  async generate(
    prompt: string, 
    model: string = OLLAMA_CONFIG.defaultModel,
    baseUrl: string = OLLAMA_CONFIG.baseUrl
  ): Promise<string> {
    const response = await secureFetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      requestInfo: {
        type: 'ollama',
        purpose: 'Generate LLM completion for character extraction',
        required: false
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
          max_tokens: 1000
        }
      })
    })

    const data = await response.json()
    return data.response || ''
  }
}

/**
 * Network status monitoring
 */
export class NetworkMonitor {
  private listeners: Array<(online: boolean) => void> = []
  private blockedRequests: NetworkRequest[] = []

  constructor() {
    // Monitor online/offline status
    window.addEventListener('online', () => this.notifyListeners(true))
    window.addEventListener('offline', () => this.notifyListeners(false))
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return navigator.onLine
  }

  /**
   * Get blocked requests count
   */
  getBlockedRequestsCount(): number {
    return this.blockedRequests.length
  }

  /**
   * Get recent blocked requests
   */
  getBlockedRequests(): NetworkRequest[] {
    return [...this.blockedRequests]
  }

  /**
   * Log a blocked request
   */
  logBlockedRequest(request: NetworkRequest): void {
    this.blockedRequests.push({
      ...request,
      timestamp: Date.now()
    } as NetworkRequest & { timestamp: number })

    // Keep only recent blocked requests (last 100)
    if (this.blockedRequests.length > 100) {
      this.blockedRequests.shift()
    }
  }

  /**
   * Subscribe to network status changes
   */
  onStatusChange(listener: (online: boolean) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(online: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener(online)
      } catch (error) {
        console.error('Network status listener error:', error)
      }
    })
  }
}

/**
 * Global network monitor instance
 */
export const networkMonitor = new NetworkMonitor()

/**
 * Enhanced error handling for network requests
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public code: string,
    public request?: NetworkRequest,
    public response?: Response
  ) {
    super(message)
    this.name = 'NetworkError'
  }

  static fromFetchError(error: Error, request?: NetworkRequest): NetworkError {
    if (error.message.includes('Failed to fetch')) {
      return new NetworkError(
        'Network connection failed. Please check your internet connection.',
        'NETWORK_ERROR',
        request
      )
    }

    if (error.message.includes('privacy settings')) {
      return new NetworkError(
        'Request blocked by privacy settings. Check your privacy configuration.',
        'PRIVACY_BLOCKED',
        request
      )
    }

    return new NetworkError(
      error.message,
      'UNKNOWN_ERROR',
      request
    )
  }

  toUserMessage(): string {
    switch (this.code) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to the internet. Please check your connection and try again.'
      
      case 'PRIVACY_BLOCKED':
        return 'This action is blocked by your privacy settings. You can adjust them in the privacy panel.'
      
      case 'OLLAMA_UNAVAILABLE':
        return 'Local LLM service is not available. Make sure Ollama is running on localhost.'
      
      case 'GUTENBERG_ERROR':
        return 'Unable to access Project Gutenberg. The service may be temporarily unavailable.'
      
      default:
        return this.message || 'An unexpected network error occurred.'
    }
  }
}

/**
 * Utility functions
 */
function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return 'unknown'
  }
}

/**
 * Request queue for managing concurrent requests
 */
export class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private concurrent = 0
  private maxConcurrent = 3

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      
      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.concurrent >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    this.concurrent++
    const requestFn = this.queue.shift()!
    
    try {
      await requestFn()
    } finally {
      this.concurrent--
      this.processQueue()
    }
  }
}

/**
 * Global request queue
 */
export const requestQueue = new RequestQueue()
