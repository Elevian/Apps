/**
 * Ollama Integration with Silent Fallback
 * Attempts LLM-based character extraction with graceful fallback to heuristic methods
 */

import { ollamaAPI } from '@/lib/security/secure-network'
import { toast } from 'sonner'

export interface OllamaConfig {
  baseUrl: string
  model: string
  timeout: number
  maxRetries: number
}

export interface FallbackResult<T> {
  data: T
  method: 'ollama' | 'heuristic'
  success: boolean
  error?: string
  processingTime: number
}

export class OllamaFallbackManager {
  private config: OllamaConfig
  private isAvailable: boolean | null = null
  private lastCheck: number = 0
  private checkCooldown: number = 30000 // 30 seconds between availability checks

  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = {
      baseUrl: 'http://localhost:11434',
      model: 'llama2',
      timeout: 30000,
      maxRetries: 2,
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

    // All Ollama attempts failed - fallback with non-intrusive notification
    console.warn(`Ollama failed after ${this.config.maxRetries} attempts:`, lastError)
    
    // Show subtle toast about fallback
    toast.info(`Using alternative ${operationName.toLowerCase()} method`, {
      duration: 3000,
      position: 'bottom-right',
      description: 'Local LLM unavailable, using built-in analysis'
    })

    try {
      const fallbackData = await heuristicFallback()
      return {
        data: fallbackData,
        method: 'heuristic',
        success: true,
        error: lastError?.message,
        processingTime: Date.now() - startTime
      }
    } catch (fallbackError) {
      throw new Error(`Both Ollama and fallback methods failed: ${fallbackError}`)
    }
  }

  /**
   * Character extraction with Ollama + fallback
   */
  async extractCharacters(
    text: string,
    maxCharacters: number = 20
  ): Promise<FallbackResult<Array<{ name: string; aliases: string[]; confidence: number }>>> {
    const ollamaOperation = async () => {
      const prompt = this.buildCharacterExtractionPrompt(text, maxCharacters)
      const response = await ollamaAPI.generate(prompt, this.config.model, this.config.baseUrl)
      return this.parseCharacterResponse(response)
    }

    const heuristicFallback = () => {
      // Import compromise.js for NLP-based extraction
      return this.extractCharactersHeuristic(text, maxCharacters)
    }

    return this.withFallback(
      ollamaOperation,
      heuristicFallback,
      'Character extraction'
    )
  }

  /**
   * Build character extraction prompt for LLM
   */
  private buildCharacterExtractionPrompt(text: string, maxCharacters: number): string {
    // Limit text size for LLM processing
    const maxTextLength = 4000
    const textSample = text.length > maxTextLength 
      ? text.substring(0, maxTextLength) + '...'
      : text

    return `Analyze this text and identify the main characters. Return ONLY a JSON array with the top ${maxCharacters} characters.

Format: [{"name": "Character Name", "aliases": ["Alias1", "Alias2"], "confidence": 0.95}]

Rules:
- Include main characters only (not minor mentions)
- List common aliases/variations of names
- Confidence score 0-1 based on importance
- Return valid JSON only, no explanation

Text to analyze:
${textSample}`
  }

  /**
   * Parse LLM response for character data
   */
  private parseCharacterResponse(response: string): Array<{ name: string; aliases: string[]; confidence: number }> {
    try {
      // Extract JSON from response (LLM might include extra text)
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No JSON array found in response')
      }

      const characters = JSON.parse(jsonMatch[0])
      
      // Validate and clean the response
      return characters
        .filter((char: any) => char.name && typeof char.name === 'string')
        .map((char: any) => ({
          name: char.name.trim(),
          aliases: Array.isArray(char.aliases) ? char.aliases.map((a: any) => String(a).trim()) : [],
          confidence: typeof char.confidence === 'number' ? Math.max(0, Math.min(1, char.confidence)) : 0.8
        }))
        .slice(0, 20) // Ensure max limit

    } catch (error) {
      console.warn('Failed to parse LLM character response:', error)
      throw new Error('Invalid character extraction response')
    }
  }

  /**
   * Heuristic character extraction using NLP patterns
   */
  private async extractCharactersHeuristic(
    text: string, 
    maxCharacters: number
  ): Promise<Array<{ name: string; aliases: string[]; confidence: number }>> {
    // Simple heuristic approach (can be enhanced with compromise.js)
    const characters = new Map<string, { mentions: number; aliases: Set<string> }>()
    
    // Common name patterns
    const namePatterns = [
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g, // Capitalized names
      /\b(?:Mr|Mrs|Miss|Dr|Professor|Captain|Sir|Lady)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g, // Titles + names
    ]

    // Extract potential character names
    for (const pattern of namePatterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1] || match[0]
        const cleanName = name.replace(/^(Mr|Mrs|Miss|Dr|Professor|Captain|Sir|Lady)\.?\s+/, '').trim()
        
        if (cleanName.length > 2 && cleanName.length < 50) {
          const existing = characters.get(cleanName) || { mentions: 0, aliases: new Set() }
          existing.mentions++
          characters.set(cleanName, existing)
        }
      }
    }

    // Convert to required format and sort by mentions
    const result = Array.from(characters.entries())
      .map(([name, data]) => ({
        name,
        aliases: Array.from(data.aliases),
        confidence: Math.min(0.9, Math.max(0.3, data.mentions / 100)) // Heuristic confidence
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxCharacters)

    return result
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OllamaConfig>): void {
    this.config = { ...this.config, ...config }
    // Reset availability check to retest with new config
    this.isAvailable = null
    this.lastCheck = 0
  }

  /**
   * Get current status
   */
  getStatus(): {
    isAvailable: boolean | null
    lastCheck: number
    config: OllamaConfig
  } {
    return {
      isAvailable: this.isAvailable,
      lastCheck: this.lastCheck,
      config: { ...this.config }
    }
  }
}

// Global instance
export const ollamaFallback = new OllamaFallbackManager()

/**
 * Convenience function for character extraction with fallback
 */
export async function extractCharactersWithFallback(
  text: string,
  maxCharacters: number = 20
): Promise<FallbackResult<Array<{ name: string; aliases: string[]; confidence: number }>>> {
  return ollamaFallback.extractCharacters(text, maxCharacters)
}
