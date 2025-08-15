import { Character } from '@/lib/api/schemas'
import { extractCharactersWithGroq, isGroqAvailable } from '../api/groq-api'

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
  ollamaEndpoint?: string
  maxCharacters?: number
  minMentions?: number
  mergeThreshold?: number // Similarity threshold for alias merging
}

/**
 * Enhanced character extraction with LLM + compromise fallback
 */
export class CharacterExtractor {
  private ollamaEndpoint: string
  
  constructor(ollamaEndpoint = 'http://localhost:11434') {
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

    // Prepare text sample (use first ~5000 characters for analysis)
    const textSample = text.substring(0, 5000)
    
    const prompt = `Analyze this text and extract the main characters. Return ONLY a JSON array of objects with this exact format:
[{"name": "Character Name", "aliases": ["Alias1", "Alias2"], "description": "Brief role"}]

Extract up to ${maxCharacters} most important characters. Include main characters, important secondary characters, and any character mentioned multiple times. For aliases, include nicknames, titles, alternate names, or different forms of the same character's name.

Text to analyze:
${textSample}`

    try {
      const response = await fetch(`${this.ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2', // Fallback models: llama2, codellama
          prompt,
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.9,
            max_tokens: 1000
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`)
      }

      const data = await response.json()
      const responseText = data.response || ''

      // Parse JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in LLM response')
      }

      const llmCharacters = JSON.parse(jsonMatch[0])
      
      return llmCharacters.map((char: any, index: number) => ({
        id: this.generateCharacterId(char.name),
        name: char.name,
        aliases: char.aliases || [],
        countGuess: 0, // Will be calculated later
        extractionMethod: 'llm' as const,
        confidence: 0.9 - (index * 0.05) // Decrease confidence with rank
      }))
    } catch (error) {
      console.error('LLM extraction error:', error)
      throw error
    }
  }

  /**
   * Extract characters using compromise NLP
   */
  private async extractWithCompromise(text: string, maxCharacters: number): Promise<ExtractedCharacter[]> {
    // Dynamic import to keep bundle size down
    const nlp = await import('compromise')
    const doc = nlp.default(text)

    // Extract proper nouns that could be people
    const people = doc.people().json()
    const places = doc.places().json()
    const properNouns = doc.match('#ProperNoun').json()

    // Combine and deduplicate
    const candidates = new Map<string, ExtractedCharacter>()

    // Process people (highest confidence)
    people.forEach((person: any) => {
      const name = person.text
      const id = this.generateCharacterId(name)
      if (!candidates.has(id)) {
        candidates.set(id, {
          id,
          name,
          aliases: [],
          countGuess: 0,
          extractionMethod: 'compromise',
          confidence: 0.8
        })
      }
    })

    // Process proper nouns (medium confidence, filter out places)
    properNouns.forEach((noun: any) => {
      const name = noun.text
      const id = this.generateCharacterId(name)
      
      // Skip if it's a known place or too short/long
      if (name.length < 2 || name.length > 30) return
      if (places.some((place: any) => place.text === name)) return
      
      // Skip common non-character words
      const nonCharacterWords = ['Chapter', 'Book', 'Part', 'Volume', 'Mr', 'Mrs', 'Miss', 'Dr', 'Sir', 'Lady']
      if (nonCharacterWords.some(word => name.includes(word))) return

      if (!candidates.has(id)) {
        candidates.set(id, {
          id,
          name,
          aliases: [],
          countGuess: 0,
          extractionMethod: 'compromise',
          confidence: 0.6
        })
      }
    })

    // Return top candidates by confidence
    return Array.from(candidates.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxCharacters)
  }

  /**
   * Merge two character lists, handling duplicates and aliases
   */
  private mergeCharacterLists(
    primary: ExtractedCharacter[], 
    secondary: ExtractedCharacter[], 
    threshold: number
  ): ExtractedCharacter[] {
    const merged = [...primary]
    
    secondary.forEach(secondChar => {
      const existing = merged.find(char => 
        this.calculateSimilarity(char.name, secondChar.name) > threshold
      )
      
      if (existing) {
        // Merge aliases
        secondChar.aliases.forEach(alias => {
          if (!existing.aliases.includes(alias) && alias !== existing.name) {
            existing.aliases.push(alias)
          }
        })
        // Keep higher confidence
        existing.confidence = Math.max(existing.confidence, secondChar.confidence)
      } else {
        merged.push(secondChar)
      }
    })
    
    return merged
  }

  /**
   * Merge similar character names as aliases
   */
  private mergeAliases(characters: ExtractedCharacter[], threshold: number): ExtractedCharacter[] {
    const merged: ExtractedCharacter[] = []
    const processed = new Set<string>()

    characters.forEach(char => {
      if (processed.has(char.id)) return

      const similar = characters.filter(other => 
        other.id !== char.id && 
        !processed.has(other.id) &&
        this.calculateSimilarity(char.name, other.name) > threshold
      )

      // Merge similar characters
      similar.forEach(sim => {
        if (!char.aliases.includes(sim.name)) {
          char.aliases.push(sim.name)
        }
        char.aliases.push(...sim.aliases)
        processed.add(sim.id)
      })

      // Deduplicate aliases
      char.aliases = [...new Set(char.aliases)].filter(alias => alias !== char.name)
      
      merged.push(char)
      processed.add(char.id)
    })

    return merged
  }

  /**
   * Count actual mentions in text for each character
   */
  private countMentions(characters: ExtractedCharacter[], text: string): ExtractedCharacter[] {
    const lowerText = text.toLowerCase()
    
    return characters.map(char => {
      let count = 0
      const patterns = [char.name, ...char.aliases]
      
      patterns.forEach(pattern => {
        const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
        const matches = lowerText.match(regex)
        count += matches ? matches.length : 0
      })
      
      return {
        ...char,
        countGuess: count
      }
    })
  }

  /**
   * Check if Ollama server is available
   */
  private async checkOllamaHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaEndpoint}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Calculate string similarity (Levenshtein distance based)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const a = str1.toLowerCase()
    const b = str2.toLowerCase()
    
    if (a === b) return 1
    if (a.includes(b) || b.includes(a)) return 0.8
    
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null))
    
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        )
      }
    }
    
    const distance = matrix[b.length][a.length]
    return 1 - distance / Math.max(a.length, b.length)
  }

  /**
   * Generate consistent character ID
   */
  private generateCharacterId(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  /**
   * Convert extracted characters to API format
   */
  static toApiFormat(characters: ExtractedCharacter[]): Character[] {
    return characters.map(char => ({
      name: char.name,
      aliases: char.aliases,
      importance: Math.round(char.confidence * 100),
      mentions: char.countGuess
    }))
  }
}
