import { Character } from '../api/schemas'
import { extractCharactersWithGroq, isGroqAvailable } from '../api/groq-api'
import { OLLAMA_CONFIG } from '../config/api'

export interface ExtractedCharacter {
  id: string
  name: string
  aliases: string[]
  countGuess: number
  extractionMethod: 'llm' | 'compromise' | 'hybrid'
  confidence: number
}

export interface CharacterExtractionOptions {
  useOllama?: boolean
  useGroq?: boolean
  maxCharacters?: number
  minMentions?: number
  mergeThreshold?: number
}

export class CharacterExtractor {
  private ollamaEndpoint: string
  
  constructor(ollamaEndpoint = OLLAMA_CONFIG.baseUrl) {
    this.ollamaEndpoint = ollamaEndpoint
  }

  /**
   * Main extraction pipeline: LLM → alias merge → heuristic fallback
   */
  async extractCharacters(
    text: string, 
    options: CharacterExtractionOptions = {}
  ): Promise<ExtractedCharacter[]> {
    const {
      useOllama = true,
      useGroq = true,
      maxCharacters = 20,
      minMentions = 2,
      mergeThreshold = 0.8
    } = options

    let characters: ExtractedCharacter[] = []
    let extractionMethod: 'llm' | 'compromise' | 'hybrid' = 'compromise'

    // Step 1: Try Groq extraction first (fastest and most reliable)
    if (useGroq && isGroqAvailable()) {
      try {
        console.log('🤖 Attempting Groq character extraction...')
        const groqResult = await extractCharactersWithGroq(text)
        if (groqResult && groqResult.characters.length > 0) {
          characters = groqResult.characters.map(char => ({
            id: char.id,
            name: char.name,
            aliases: char.aliases,
            countGuess: char.countGuess,
            extractionMethod: 'llm' as const,
            confidence: groqResult.confidence || 0.8
          }))
          extractionMethod = 'llm'
          console.log(`✅ Groq extracted ${characters.length} characters`)
        }
      } catch (error) {
        console.warn('Groq extraction failed, trying Ollama...', error)
      }
    }

    // Step 2: Try Ollama LLM extraction if Groq failed
    if (characters.length === 0 && useOllama) {
      try {
        const llmCharacters = await this.extractWithLLM(text, maxCharacters)
        if (llmCharacters.length > 0) {
          characters = llmCharacters
          extractionMethod = 'llm'
        }
      } catch (error) {
        console.warn('LLM extraction failed, falling back to compromise:', error)
      }
    }

    // Step 3: Fallback to compromise if all LLM methods failed
    if (characters.length === 0) {
      characters = await this.extractWithCompromise(text, maxCharacters)
      extractionMethod = 'compromise'
    }

    // Step 3: Enhance with compromise if LLM was partial
    if (extractionMethod === 'llm' && characters.length < maxCharacters / 2) {
      const compromiseCharacters = await this.extractWithCompromise(text, maxCharacters)
      characters = this.mergeCharacterLists(characters, compromiseCharacters, mergeThreshold)
      extractionMethod = 'hybrid'
    }

    // Step 4: Alias merging and normalization
    characters = this.mergeAliases(characters, mergeThreshold)

    // Step 5: Filter by minimum mentions and count
    characters = this.countMentions(characters, text)
    characters = characters
      .filter(char => char.countGuess >= minMentions)
      .slice(0, maxCharacters)
      .sort((a, b) => b.countGuess - a.countGuess)

    // Update extraction method for each character
    characters.forEach(char => {
      char.extractionMethod = extractionMethod
    })

    return characters
  }

  /**
   * Extract characters using Ollama LLM
   */
  private async extractWithLLM(text: string, maxCharacters: number): Promise<ExtractedCharacter[]> {
    // Check if Ollama is available
    const isAvailable = await this.checkOllamaHealth()
    if (!isAvailable) {
      throw new Error('Ollama server not available')
    }

    try {
      const prompt = this.buildCharacterExtractionPrompt(text, maxCharacters)
      const response = await fetch(`${this.ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OLLAMA_CONFIG.defaultModel,
          prompt,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9,
            max_tokens: 1000
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`)
      }

      const data = await response.json()
      const llmResponse = data.response || ''

      // Parse the LLM response
      const characters = this.parseLLMResponse(llmResponse, maxCharacters)
      return characters

    } catch (error) {
      console.error('Ollama LLM extraction failed:', error)
      throw error
    }
  }

  /**
   * Check Ollama server health
   */
  private async checkOllamaHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaEndpoint}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return response.ok
    } catch (error) {
      console.warn('Ollama health check failed:', error)
      return false
    }
  }

  /**
   * Build prompt for character extraction
   */
  private buildCharacterExtractionPrompt(text: string, maxCharacters: number): string {
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
  private parseLLMResponse(response: string, maxCharacters: number): ExtractedCharacter[] {
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
          id: this.generateId(char.name),
          name: char.name.trim(),
          aliases: Array.isArray(char.aliases) ? char.aliases.map((a: any) => String(a).trim()) : [],
          countGuess: 0, // Will be updated later
          extractionMethod: 'llm' as const,
          confidence: typeof char.confidence === 'number' ? Math.max(0, Math.min(1, char.confidence)) : 0.8
        }))
        .slice(0, maxCharacters)

    } catch (error) {
      console.warn('Failed to parse LLM character response:', error)
      throw new Error('Invalid character extraction response')
    }
  }

  /**
   * Extract characters using compromise.js NLP
   */
  private async extractWithCompromise(text: string, maxCharacters: number): Promise<ExtractedCharacter[]> {
    try {
      // Dynamic import to avoid SSR issues
      const compromise = await import('compromise')
      const doc = compromise.default(text)
      
      // Extract people names
      const people = doc.people().out('array')
      
      // Count occurrences and create character objects
      const characterMap = new Map<string, { count: number; aliases: Set<string> }>()
      
      people.forEach((person: string) => {
        const cleanName = person.trim()
        if (cleanName.length > 2 && cleanName.length < 50) {
          const existing = characterMap.get(cleanName) || { count: 0, aliases: new Set() }
          existing.count++
          characterMap.set(cleanName, existing)
        }
      })

      // Convert to ExtractedCharacter format
      const characters: ExtractedCharacter[] = Array.from(characterMap.entries())
        .map(([name, data]) => ({
          id: this.generateId(name),
          name,
          aliases: Array.from(data.aliases),
          countGuess: data.count,
          extractionMethod: 'compromise' as const,
          confidence: Math.min(0.9, Math.max(0.3, data.count / 100))
        }))
        .sort((a, b) => b.countGuess - a.countGuess)
        .slice(0, maxCharacters)

      return characters

    } catch (error) {
      console.warn('Compromise extraction failed:', error)
      // Fallback to simple regex-based extraction
      return this.extractWithRegex(text, maxCharacters)
    }
  }

  /**
   * Fallback regex-based character extraction
   */
  private extractWithRegex(text: string, maxCharacters: number): ExtractedCharacter[] {
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
        id: this.generateId(name),
        name,
        aliases: Array.from(data.aliases),
        countGuess: data.mentions,
        extractionMethod: 'compromise' as const,
        confidence: Math.min(0.9, Math.max(0.3, data.mentions / 100)) // Heuristic confidence
      }))
      .sort((a, b) => b.countGuess - a.countGuess)
      .slice(0, maxCharacters)

    return result
  }

  /**
   * Merge character lists from different extraction methods
   */
  private mergeCharacterLists(
    primary: ExtractedCharacter[], 
    secondary: ExtractedCharacter[], 
    threshold: number
  ): ExtractedCharacter[] {
    const merged = [...primary]
    const primaryNames = new Set(primary.map(c => c.name.toLowerCase()))

    for (const char of secondary) {
      if (!primaryNames.has(char.name.toLowerCase())) {
        merged.push(char)
      }
    }

    return merged
  }

  /**
   * Merge aliases for similar character names
   */
  private mergeAliases(characters: ExtractedCharacter[], threshold: number): ExtractedCharacter[] {
    const merged: ExtractedCharacter[] = []
    const processed = new Set<string>()

    for (const char of characters) {
      if (processed.has(char.name.toLowerCase())) continue

      const similar = characters.filter(c => 
        c !== char && 
        !processed.has(c.name.toLowerCase()) &&
        this.calculateSimilarity(char.name, c.name) >= threshold
      )

      if (similar.length > 0) {
        // Merge similar characters
        const allAliases = [char.name, ...char.aliases, ...similar.flatMap(s => [s.name, ...s.aliases])]
        const mergedChar: ExtractedCharacter = {
          ...char,
          aliases: allAliases.filter((name, index, arr) => arr.indexOf(name) === index)
        }
        merged.push(mergedChar)
        
        // Mark similar characters as processed
        similar.forEach(s => processed.add(s.name.toLowerCase()))
      } else {
        merged.push(char)
      }

      processed.add(char.name.toLowerCase())
    }

    return merged
  }

  /**
   * Calculate similarity between two names
   */
  private calculateSimilarity(name1: string, name2: string): number {
    const words1 = name1.toLowerCase().split(/\s+/)
    const words2 = name2.toLowerCase().split(/\s+/)
    
    let matches = 0
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
          matches++
        }
      }
    }
    
    return matches / Math.max(words1.length, words2.length)
  }

  /**
   * Count actual mentions in text
   */
  private countMentions(characters: ExtractedCharacter[], text: string): ExtractedCharacter[] {
    return characters.map(char => {
      const nameRegex = new RegExp(`\\b${char.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      const matches = text.match(nameRegex) || []
      
      // Count alias mentions too
      let totalMentions = matches.length
      for (const alias of char.aliases) {
        const aliasRegex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
        const aliasMatches = text.match(aliasRegex) || []
        totalMentions += aliasMatches.length
      }

      return {
        ...char,
        countGuess: totalMentions
      }
    })
  }

  /**
   * Generate unique ID for character
   */
  private generateId(name: string): string {
    return `char_${name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}_${Date.now()}`
  }
}
