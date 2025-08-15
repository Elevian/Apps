/**
 * Ollama Integration with Silent Fallback
 * Attempts LLM-based character extraction with graceful fallback to heuristic methods
 */

import { toast } from 'sonner'
import { ollamaAPI } from '../security/secure-network'
import { OLLAMA_CONFIG } from '../config/api'

export interface OllamaConfig {
  baseUrl: string
  model: string
  timeout: number
  maxRetries: number
}

export interface FallbackResult<T> {
  data: T
  method: 'ollama' | 'heuristic' | 'hybrid'
  success: boolean
  processingTime: number
}

export interface OllamaResponse {
  response: string
  model: string
  done: boolean
}

/**
 * OllamaFallback provides LLM-based operations with heuristic fallbacks
 * when Ollama is unavailable or fails
 */
export class OllamaFallback {
  private config: OllamaConfig
  private isAvailable: boolean | null = null
  private lastCheck: number = 0
  private checkCooldown: number = 30000 // 30 seconds between availability checks

  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = {
      baseUrl: OLLAMA_CONFIG.baseUrl,
      model: OLLAMA_CONFIG.defaultModel,
      timeout: OLLAMA_CONFIG.timeout,
      maxRetries: OLLAMA_CONFIG.maxRetries,
      ...config
    }
  }

  /**
   * Check if Ollama is available with caching
   */
  async isOllamaAvailable(): Promise<boolean> {
    const now = Date.now()
    
    // Use cached result if within cooldown period
    if (this.isAvailable !== null && (now - this.lastCheck) < this.checkCooldown) {
      return this.isAvailable
    }

    try {
      this.isAvailable = await ollamaAPI.isAvailable(this.config.baseUrl)
      this.lastCheck = now
      return this.isAvailable
    } catch (error) {
      this.isAvailable = false
      this.lastCheck = now
      return false
    }
  }

  /**
   * Attempt LLM-based operation with fallback
   */
  async withFallback<T>(
    ollamaOperation: () => Promise<T>,
    heuristicFallback: () => Promise<T> | T,
    operationName: string = 'LLM operation'
  ): Promise<FallbackResult<T>> {
    const startTime = Date.now()

    // Check availability first
    const available = await this.isOllamaAvailable()
    
    if (!available) {
      // Silent fallback - no user notification for unavailable service
      const fallbackData = await heuristicFallback()
      return {
        data: fallbackData,
        method: 'heuristic',
        success: true,
        processingTime: Date.now() - startTime
      }
    }

    // Attempt Ollama operation with retries
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Ollama request timeout')), this.config.timeout)
        })

        const ollamaData = await Promise.race([
          ollamaOperation(),
          timeoutPromise
        ])

        // Success - show subtle success indicator
        if (attempt > 1) {
          toast.success(`${operationName} completed via local LLM`, {
            duration: 2000,
            position: 'bottom-right'
          })
        }

        return {
          data: ollamaData,
          method: 'ollama',
          success: true,
          processingTime: Date.now() - startTime
        }

      } catch (error) {
        lastError = error as Error
        console.warn(`Ollama attempt ${attempt} failed:`, error)
        
        // Wait before retry (exponential backoff)
        if (attempt < this.config.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    // All attempts failed - fallback to heuristic
    console.warn(`Ollama failed after ${this.config.maxRetries} attempts, using heuristic fallback`)
    
    try {
      const fallbackData = await heuristicFallback()
      return {
        data: fallbackData,
        method: 'heuristic',
        success: true,
        processingTime: Date.now() - startTime
      }
    } catch (fallbackError) {
      console.error('Both Ollama and heuristic fallback failed:', fallbackError)
      throw new Error(`Operation failed: ${lastError?.message || 'Unknown error'}`)
    }
  }

  /**
   * Generate text completion with fallback
   */
  async generateText(
    prompt: string,
    fallbackText: string = 'Text generation unavailable'
  ): Promise<FallbackResult<string>> {
    return this.withFallback(
      async () => {
        const response = await ollamaAPI.generate(prompt, this.config.model, this.config.baseUrl)
        return response || fallbackText
      },
      () => fallbackText,
      'Text generation'
    )
  }

  /**
   * Extract structured data with fallback
   */
  async extractStructuredData<T>(
    prompt: string,
    fallbackData: T,
    operationName: string = 'Data extraction'
  ): Promise<FallbackResult<T>> {
    return this.withFallback(
      async () => {
        const response = await ollamaAPI.generate(prompt, this.config.model, this.config.baseUrl)
        
        try {
          // Attempt to parse JSON response
          const parsed = JSON.parse(response)
          return parsed as T
        } catch {
          // If parsing fails, return fallback
          console.warn('Failed to parse Ollama response as JSON, using fallback')
          return fallbackData
        }
      },
      () => fallbackData,
      operationName
    )
  }

  /**
   * Get current configuration
   */
  getConfig(): OllamaConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OllamaConfig>): void {
    this.config = { ...this.config, ...newConfig }
    // Reset availability cache when config changes
    this.isAvailable = null
    this.lastCheck = 0
  }
}

// Global instance
export const ollamaFallback = new OllamaFallback()
