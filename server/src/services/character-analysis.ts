import fetch from 'node-fetch'
import nlp from 'compromise'

export interface Character {
  name: string
  aliases: string[]
  importance: number
  mentions: number
  description?: string
}

export interface CharacterAnalysisResult {
  characters: Character[]
  method: 'ollama' | 'compromise'
  processing_time_ms: number
  text_length: number
  total_characters: number
}

export interface AnalysisRequest {
  text: string
  mode?: 'ollama' | 'auto'
  max_characters?: number
}

export class CharacterAnalysisService {
  private static readonly OLLAMA_BASE_URL = 'http://localhost:11434'
  private static readonly DEFAULT_MODEL = 'llama3.2'
  private static readonly MAX_TEXT_LENGTH = 50000 // Limit text for processing

  /**
   * Main character analysis method with LLM fallback
   */
  static async analyzeCharacters(request: AnalysisRequest): Promise<CharacterAnalysisResult> {
    const startTime = Date.now()
    const { text, mode = 'auto', max_characters = 20 } = request
    
    // Truncate text if too long
    const truncatedText = text.length > this.MAX_TEXT_LENGTH 
      ? text.substring(0, this.MAX_TEXT_LENGTH)
      : text

    let result: CharacterAnalysisResult

    try {
      if (mode === 'ollama' || mode === 'auto') {
        // Try Ollama first
        result = await this.analyzeWithOllama(truncatedText, max_characters)
        result.processing_time_ms = Date.now() - startTime
        return result
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.log('Ollama analysis failed, falling back to compromise:', errorMsg)
      
      if (mode === 'ollama') {
        throw new Error(`Ollama analysis failed: ${errorMsg}`)
      }
    }

    // Fallback to compromise
    result = await this.analyzeWithCompromise(truncatedText, max_characters)
    result.processing_time_ms = Date.now() - startTime
    return result
  }

  /**
   * Character analysis using Ollama LLM
   */
  private static async analyzeWithOllama(text: string, maxCharacters: number): Promise<CharacterAnalysisResult> {
    // Check if Ollama is available
    try {
      const healthResponse = await fetch(`${this.OLLAMA_BASE_URL}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      })
      
      if (!healthResponse.ok) {
        throw new Error('Ollama server not accessible')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Ollama health check failed: ${errorMsg}`)
    }

    const prompt = `Analyze the following text and extract character names. Return ONLY a JSON array of characters with this exact structure:

[
  {
    "name": "Character Full Name",
    "aliases": ["Alternative name", "Nickname"],
    "importance": 85,
    "mentions": 12,
    "description": "Brief character description"
  }
]

Rules:
- Include only actual character names (people), not places or objects
- "importance" should be 1-100 based on role significance  
- "mentions" should count approximate appearances
- "aliases" can be empty array if no alternatives
- Return maximum ${maxCharacters} most important characters
- Must be valid JSON only, no other text

Text to analyze:
${text.substring(0, 8000)}`

    try {
      const response = await fetch(`${this.OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.DEFAULT_MODEL,
          prompt,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9,
          }
        }),
        signal: AbortSignal.timeout(60000)
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as any
      const llmResponse = data.response

      // Parse the JSON response
      let characters: Character[]
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = llmResponse.match(/\[[\s\S]*\]/)
        const jsonString = jsonMatch ? jsonMatch[0] : llmResponse
        characters = JSON.parse(jsonString)
      } catch (parseError) {
        console.error('Failed to parse Ollama JSON response:', llmResponse)
        throw new Error('Ollama returned invalid JSON format')
      }

      // Validate and clean the results
      const validCharacters = characters
        .filter(char => char.name && typeof char.name === 'string')
        .map(char => ({
          name: char.name.trim(),
          aliases: Array.isArray(char.aliases) ? char.aliases.filter(a => a && typeof a === 'string') : [],
          importance: Math.max(1, Math.min(100, Number(char.importance) || 50)),
          mentions: Math.max(1, Number(char.mentions) || 1),
          description: char.description || undefined
        }))
        .slice(0, maxCharacters)

      return {
        characters: validCharacters,
        method: 'ollama',
        processing_time_ms: 0, // Will be set by caller
        text_length: text.length,
        total_characters: validCharacters.length
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Ollama processing failed: ${errorMsg}`)
    }
  }

  /**
   * Character analysis using compromise.js as fallback
   */
  private static async analyzeWithCompromise(text: string, maxCharacters: number): Promise<CharacterAnalysisResult> {
    const doc = nlp(text)
    
    // Extract person names
    const people = doc.people()
    const places = doc.places() // To filter out place names
    
    // Get all person entities
    const personEntities = people.json()
    const placeNames = new Set(places.out('array'))
    
    // Count mentions and build character map
    const characterMap = new Map<string, Character>()
    
    // Process each sentence to find name mentions
    const sentences = doc.sentences().json()
    
    for (const entity of personEntities) {
      const name = entity.text.trim()
      
      // Skip if it's likely a place name
      if (placeNames.has(name)) continue
      
      // Skip single letters or very short names
      if (name.length < 2) continue
      
      // Skip pronouns and common words that might be misidentified
      const commonWords = [
        'he', 'she', 'it', 'they', 'we', 'i', 'you', 'the', 'and', 'or', 'but',
        'his', 'her', 'hers', 'him', 'them', 'their', 'theirs', 'my', 'mine',
        'your', 'yours', 'our', 'ours', 'this', 'that', 'these', 'those',
        'who', 'whom', 'whose', 'which', 'what', 'where', 'when', 'why', 'how',
        'one', 'some', 'any', 'all', 'each', 'every', 'few', 'many', 'most',
        'other', 'another', 'such', 'same', 'own', 'very', 'only', 'just'
      ]
      if (commonWords.includes(name.toLowerCase())) continue
      
      // Skip if the name is all lowercase (likely not a proper noun)
      if (name === name.toLowerCase()) continue
      
      // Skip if it contains numbers or special characters
      if (/[0-9@#$%^&*()_+=\[\]{}|;':".,/<>?`~]/.test(name)) continue
      
      // Count mentions in text
      const mentions = this.countMentions(text, name)
      
      if (mentions > 0) {
        const aliases = this.findAliases(text, name)
        const importance = this.calculateImportance(mentions, text.length, name)
        
        characterMap.set(name, {
          name,
          aliases,
          importance,
          mentions,
          description: `Character appearing ${mentions} times in the text`
        })
      }
    }
    
    // Look for title + name patterns (Mr., Mrs., Miss, Dr., etc.) - more precise
    const titlePattern = /\b(?:Mr|Mrs|Miss|Ms|Dr|Professor|Sir|Lady|Lord|Captain|Colonel|Lieutenant|Major|General)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g
    let titleMatch
    while ((titleMatch = titlePattern.exec(text)) !== null) {
      const fullName = titleMatch[0].trim()
      const lastName = titleMatch[1].trim()
      
      // Skip if the "name" part is too long (likely not a real name)
      if (lastName.split(' ').length > 3) continue
      
      const mentions = this.countMentions(text, fullName)
      if (mentions >= 1) {
        const existing = characterMap.get(fullName)
        if (!existing) {
          characterMap.set(fullName, {
            name: fullName,
            aliases: [lastName],
            importance: this.calculateImportance(mentions, text.length, fullName) + 5, // Boost for titles
            mentions,
            description: `Titled character`
          })
        }
      }
    }
    
    // Look for simple dialogue attribution patterns - very conservative
    const simpleDialoguePattern = /(?:"[^"]{5,50}")(?:\s*,?\s*(?:said|replied|asked)\s+)([A-Z][a-z]+)\b/g
    let dialogueMatch
    while ((dialogueMatch = simpleDialoguePattern.exec(text)) !== null) {
      const name = dialogueMatch[1].trim()
      
      // Only accept single word names for dialogue to avoid false positives
      if (name.length > 2 && name.length < 15 && !placeNames.has(name)) {
        const commonWords = ['He', 'She', 'It', 'They', 'We', 'You', 'The', 'And', 'Or', 'But', 'This', 'That', 'His', 'Her']
        if (commonWords.includes(name)) continue
        
        const mentions = this.countMentions(text, name)
        if (mentions >= 1) {
          const existing = characterMap.get(name)
          if (!existing) {
            characterMap.set(name, {
              name,
              aliases: [],
              importance: this.calculateImportance(mentions, text.length, name) + 15, // Higher boost for dialogue
              mentions,
              description: `Character with dialogue`
            })
          } else {
            // Boost importance if they have dialogue
            existing.importance += 15
            existing.description = `Character with dialogue`
          }
        }
      }
    }
    
    // Convert to array and sort by importance
    const characters = Array.from(characterMap.values())
      .sort((a, b) => b.importance - a.importance)
      .slice(0, maxCharacters)
    
    return {
      characters,
      method: 'compromise',
      processing_time_ms: 0, // Will be set by caller
      text_length: text.length,
      total_characters: characters.length
    }
  }

  /**
   * Count mentions of a character name in text
   */
  private static countMentions(text: string, name: string): number {
    const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    const matches = text.match(regex)
    return matches ? matches.length : 0
  }

  /**
   * Find alternative names/aliases for a character
   */
  private static findAliases(text: string, mainName: string): string[] {
    const aliases: Set<string> = new Set()
    
    // Look for patterns like "John Smith, also known as..." or "Mr. Smith"
    const firstName = mainName.split(' ')[0]
    const lastName = mainName.split(' ').slice(1).join(' ')
    
    if (firstName && lastName) {
      // Check for title + last name patterns
      const titlePatterns = ['Mr.', 'Mrs.', 'Miss', 'Dr.', 'Sir', 'Lord', 'Lady']
      for (const title of titlePatterns) {
        if (this.countMentions(text, `${title} ${lastName}`) > 0) {
          aliases.add(`${title} ${lastName}`)
        }
      }
      
      // Check for just first name usage
      if (this.countMentions(text, firstName) > this.countMentions(text, mainName)) {
        aliases.add(firstName)
      }
    }
    
    return Array.from(aliases).slice(0, 3) // Limit aliases
  }

  /**
   * Calculate character importance based on mentions and context
   */
  private static calculateImportance(mentions: number, textLength: number, name: string): number {
    // Base importance on mention frequency
    const mentionFrequency = mentions / (textLength / 1000) // mentions per 1000 characters
    let importance = Math.min(100, mentionFrequency * 20)
    
    // Boost for common important name patterns
    if (name.split(' ').length > 1) importance += 10 // Full names are more important
    if (mentions > 10) importance += 15 // Frequently mentioned
    if (mentions > 20) importance += 15 // Very frequently mentioned
    
    return Math.max(1, Math.min(100, Math.round(importance)))
  }
}
