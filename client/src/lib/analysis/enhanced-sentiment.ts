import { Character } from '@/lib/api/schemas'

export interface EnhancedQuote {
  id: string
  text: string
  character: string | null
  characterId: string | null
  
  // Position info
  startIndex: number
  endIndex: number
  chapter: number
  
  // Sentiment analysis
  sentimentScore: number
  sentimentLabel: 'very negative' | 'negative' | 'neutral' | 'positive' | 'very positive'
  confidence: number
  emotionalIntensity: number
  
  // Enhanced features
  quoteType: 'direct' | 'indirect' | 'thought' | 'narrative'
  emotions: string[]
  topics: string[]
  
  // Context
  contextBefore: string
  contextAfter: string
}

export interface SentimentOptions {
  includeNegation?: boolean
  emotionalWords?: boolean
  contextWindow?: number
  minQuoteLength?: number
  maxQuoteLength?: number
}

/**
 * AFINN-based sentiment lexicon (simplified version)
 */
const AFINN_LEXICON: Record<string, number> = {
  // Very negative (-5 to -3)
  'hate': -3, 'terrible': -3, 'awful': -3, 'horrible': -3, 'disgusting': -3,
  'worst': -3, 'despise': -3, 'loathe': -3, 'furious': -3, 'enraged': -3,
  'devastated': -4, 'heartbroken': -4, 'miserable': -4, 'agonizing': -4,
  'catastrophic': -5, 'atrocious': -5, 'abominable': -5,
  
  // Negative (-2 to -1)
  'bad': -2, 'sad': -2, 'angry': -2, 'worried': -2, 'upset': -2,
  'disappointed': -2, 'frustrated': -2, 'annoyed': -2, 'unhappy': -2,
  'dislike': -1, 'concerned': -1, 'doubtful': -1, 'uncertain': -1,
  
  // Neutral (0)
  'okay': 0, 'fine': 0, 'normal': 0, 'usual': 0,
  
  // Positive (1 to 2)
  'good': 2, 'happy': 2, 'pleased': 2, 'glad': 2, 'content': 2,
  'satisfied': 2, 'enjoy': 2, 'like': 1, 'nice': 1, 'pleasant': 1,
  'cheerful': 2, 'delighted': 2, 'excited': 2, 'optimistic': 2,
  
  // Very positive (3 to 5)
  'love': 3, 'wonderful': 3, 'amazing': 3, 'excellent': 3, 'fantastic': 3,
  'brilliant': 3, 'marvelous': 3, 'magnificent': 3, 'superb': 3,
  'extraordinary': 4, 'phenomenal': 4, 'outstanding': 4, 'spectacular': 4,
  'perfect': 5, 'incredible': 5, 'fabulous': 5, 'divine': 5,
  
  // Emotional intensifiers
  'very': 0.5, 'extremely': 1, 'incredibly': 1, 'absolutely': 1,
  'completely': 0.5, 'totally': 0.5, 'utterly': 1, 'quite': 0.3,
  'rather': 0.3, 'somewhat': 0.2, 'slightly': -0.2, 'barely': -0.3,
  
  // Negation words (handled separately)
  'not': 0, 'no': 0, 'never': 0, 'none': 0, 'nothing': 0,
  'nobody': 0, 'nowhere': 0, 'neither': 0, 'nor': 0,
  
  // Modal verbs affecting sentiment
  'must': 0.2, 'should': 0.1, 'could': 0, 'might': -0.1, 'may': 0,
  'will': 0.1, 'would': 0, 'can': 0.1, 'cannot': -0.2, 'cant': -0.2
}

/**
 * Emotional categories for enhanced analysis
 */
const EMOTION_CATEGORIES: Record<string, string[]> = {
  joy: ['happy', 'joyful', 'cheerful', 'delighted', 'ecstatic', 'elated', 'glad', 'pleased'],
  sadness: ['sad', 'depressed', 'melancholy', 'sorrowful', 'grief', 'mourning', 'despair'],
  anger: ['angry', 'furious', 'enraged', 'irritated', 'annoyed', 'frustrated', 'mad'],
  fear: ['afraid', 'scared', 'terrified', 'anxious', 'worried', 'nervous', 'frightened'],
  surprise: ['surprised', 'amazed', 'astonished', 'shocked', 'stunned', 'startled'],
  disgust: ['disgusted', 'repulsed', 'revolted', 'sickened', 'nauseated'],
  love: ['love', 'adore', 'cherish', 'treasure', 'affection', 'devoted', 'passionate'],
  hope: ['hopeful', 'optimistic', 'confident', 'encouraged', 'inspired'],
  despair: ['hopeless', 'despairing', 'desperate', 'defeated', 'crushed']
}

/**
 * Enhanced sentiment and quote analyzer
 */
export class EnhancedSentimentAnalyzer {
  
  /**
   * Extract and analyze quotes with enhanced sentiment
   */
  extractAndAnalyzeQuotes(
    text: string,
    characters: Character[],
    maxQuotes = 20,
    options: SentimentOptions = {}
  ): EnhancedQuote[] {
    const {
      includeNegation = true,
      emotionalWords = true,
      contextWindow = 100,
      minQuoteLength = 10,
      maxQuoteLength = 500
    } = options

    const quotes = this.extractQuotes(text, contextWindow)
    const analyzedQuotes: EnhancedQuote[] = []

    quotes.forEach((quote, index) => {
      if (quote.text.length < minQuoteLength || quote.text.length > maxQuoteLength) {
        return
      }

      const character = this.identifyCharacter(quote, characters, text)
      const sentiment = this.analyzeSentiment(quote.text, includeNegation)
      const emotions = emotionalWords ? this.extractEmotions(quote.text) : []
      const topics = this.extractTopics(quote.text)

      analyzedQuotes.push({
        id: `quote-${index}`,
        text: quote.text,
        character: character?.name || null,
        characterId: character ? this.generateCharacterId(character.name) : null,
        
        startIndex: quote.startIndex,
        endIndex: quote.endIndex,
        chapter: quote.chapter,
        
        sentimentScore: sentiment.score,
        sentimentLabel: sentiment.label,
        confidence: sentiment.confidence,
        emotionalIntensity: sentiment.intensity,
        
        quoteType: quote.type,
        emotions,
        topics,
        
        contextBefore: quote.contextBefore,
        contextAfter: quote.contextAfter
      })
    })

    // Sort by emotional intensity and sentiment strength
    return analyzedQuotes
      .sort((a, b) => {
        const aStrength = Math.abs(a.sentimentScore) * a.emotionalIntensity
        const bStrength = Math.abs(b.sentimentScore) * b.emotionalIntensity
        return bStrength - aStrength
      })
      .slice(0, maxQuotes)
  }

  /**
   * Extract quotes with robust detection of quote markers
   */
  private extractQuotes(text: string, contextWindow: number): Array<{
    text: string
    type: 'direct' | 'indirect' | 'thought' | 'narrative'
    startIndex: number
    endIndex: number
    chapter: number
    contextBefore: string
    contextAfter: string
  }> {
    const quotes: Array<any> = []
    
    // Patterns for different quote types
    const patterns = [
      // Direct quotes with various quote marks
      {
        regex: /["'"'"](.*?)["'"'"]/g,
        type: 'direct' as const
      },
      // Em-dash dialogue
      {
        regex: /—([^—\n]+)—/g,
        type: 'direct' as const
      },
      // Thought patterns
      {
        regex: /\bthought\s+["'"'"](.*?)["'"'"]/gi,
        type: 'thought' as const
      },
      {
        regex: /\bthinking\s+["'"'"](.*?)["'"'"]/gi,
        type: 'thought' as const
      },
      // Indirect speech patterns
      {
        regex: /\bsaid\s+that\s+([^.!?]+[.!?])/gi,
        type: 'indirect' as const
      },
      {
        regex: /\btold\s+\w+\s+that\s+([^.!?]+[.!?])/gi,
        type: 'indirect' as const
      }
    ]

    patterns.forEach(pattern => {
      let match
      while ((match = pattern.regex.exec(text)) !== null) {
        const quoteText = match[1]?.trim()
        if (!quoteText || quoteText.length < 5) continue

        const startIndex = match.index
        const endIndex = startIndex + match[0].length
        
        quotes.push({
          text: quoteText,
          type: pattern.type,
          startIndex,
          endIndex,
          chapter: this.getChapterNumber(text, startIndex),
          contextBefore: this.getContext(text, startIndex, contextWindow, 'before'),
          contextAfter: this.getContext(text, endIndex, contextWindow, 'after')
        })
      }
    })

    return quotes
  }

  /**
   * Enhanced sentiment analysis with AFINN and negation handling
   */
  private analyzeSentiment(text: string, includeNegation: boolean): {
    score: number
    label: 'very negative' | 'negative' | 'neutral' | 'positive' | 'very positive'
    confidence: number
    intensity: number
  } {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0)

    let totalScore = 0
    let wordCount = 0
    let intensitySum = 0
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      let wordScore = AFINN_LEXICON[word] || 0
      let intensity = Math.abs(wordScore)

      if (wordScore !== 0) {
        // Handle intensifiers (very, extremely, etc.)
        if (i > 0) {
          const prevWord = words[i - 1]
          const intensifier = AFINN_LEXICON[prevWord]
          if (intensifier && Math.abs(intensifier) < 2) {
            wordScore = wordScore * (1 + Math.abs(intensifier))
            intensity *= (1 + Math.abs(intensifier))
          }
        }

        // Handle negation
        if (includeNegation && i > 0) {
          const negationWords = ['not', 'no', 'never', 'none', 'nothing', 'nobody', 'nowhere', 'neither', 'nor', 'dont', "don't", 'doesnt', "doesn't", 'wont', "won't", 'cant', "can't"]
          for (let j = Math.max(0, i - 3); j < i; j++) {
            if (negationWords.includes(words[j])) {
              wordScore = -wordScore * 0.8 // Reduce intensity of negated sentiment
              intensity *= 0.8
              break
            }
          }
        }

        totalScore += wordScore
        intensitySum += intensity
        wordCount++
      }
    }

    const normalizedScore = wordCount > 0 ? totalScore / wordCount : 0
    const averageIntensity = wordCount > 0 ? intensitySum / wordCount : 0
    
    // Determine label
    let label: 'very negative' | 'negative' | 'neutral' | 'positive' | 'very positive'
    if (normalizedScore <= -2) label = 'very negative'
    else if (normalizedScore <= -0.5) label = 'negative'
    else if (normalizedScore >= 2) label = 'very positive'
    else if (normalizedScore >= 0.5) label = 'positive'
    else label = 'neutral'

    // Calculate confidence based on word coverage and intensity
    const coverage = wordCount / words.length
    const confidence = Math.min(1, coverage * 0.7 + averageIntensity * 0.3)

    return {
      score: normalizedScore,
      label,
      confidence,
      intensity: averageIntensity
    }
  }

  /**
   * Extract emotional categories from text
   */
  private extractEmotions(text: string): string[] {
    const lowerText = text.toLowerCase()
    const detectedEmotions: string[] = []

    Object.entries(EMOTION_CATEGORIES).forEach(([emotion, keywords]) => {
      const hasEmotion = keywords.some(keyword => 
        lowerText.includes(keyword)
      )
      if (hasEmotion) {
        detectedEmotions.push(emotion)
      }
    })

    return detectedEmotions
  }

  /**
   * Extract basic topics from text (simplified keyword extraction)
   */
  private extractTopics(text: string): string[] {
    const topicKeywords = {
      love: ['love', 'romance', 'marry', 'kiss', 'heart', 'affection'],
      death: ['death', 'die', 'kill', 'murder', 'grave', 'funeral'],
      war: ['war', 'battle', 'fight', 'soldier', 'weapon', 'army'],
      family: ['family', 'mother', 'father', 'sister', 'brother', 'child'],
      friendship: ['friend', 'companion', 'loyalty', 'trust', 'support'],
      betrayal: ['betray', 'deceive', 'lie', 'cheat', 'false', 'traitor'],
      revenge: ['revenge', 'vengeance', 'retribution', 'payback', 'justice'],
      money: ['money', 'wealth', 'gold', 'poor', 'rich', 'fortune']
    }

    const lowerText = text.toLowerCase()
    const topics: string[] = []

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const relevance = keywords.filter(keyword => lowerText.includes(keyword)).length
      if (relevance > 0) {
        topics.push(topic)
      }
    })

    return topics
  }

  /**
   * Identify which character is speaking/associated with the quote
   */
  private identifyCharacter(
    quote: any,
    characters: Character[],
    fullText: string
  ): Character | null {
    const contextText = quote.contextBefore + ' ' + quote.contextAfter
    const searchText = contextText.toLowerCase()

    // Look for character names in the context
    for (const character of characters) {
      const names = [character.name, ...character.aliases]
      
      for (const name of names) {
        const namePattern = new RegExp(`\\b${name.toLowerCase()}\\b`, 'g')
        if (namePattern.test(searchText)) {
          return character
        }
      }
    }

    // Look for dialogue tags
    const dialogueTags = ['said', 'asked', 'replied', 'whispered', 'shouted', 'exclaimed', 'murmured']
    for (const tag of dialogueTags) {
      const tagPattern = new RegExp(`(\\w+)\\s+${tag}`, 'gi')
      const match = tagPattern.exec(contextText)
      if (match) {
        const speakerName = match[1]
        const character = characters.find(c => 
          c.name.toLowerCase().includes(speakerName.toLowerCase()) ||
          c.aliases.some(alias => alias.toLowerCase().includes(speakerName.toLowerCase()))
        )
        if (character) return character
      }
    }

    return null
  }

  /**
   * Get context around a position in text
   */
  private getContext(text: string, position: number, windowSize: number, direction: 'before' | 'after'): string {
    if (direction === 'before') {
      const start = Math.max(0, position - windowSize)
      return text.substring(start, position).trim()
    } else {
      const end = Math.min(text.length, position + windowSize)
      return text.substring(position, end).trim()
    }
  }

  /**
   * Get chapter number for a text position
   */
  private getChapterNumber(text: string, position: number): number {
    const beforeText = text.substring(0, position)
    const chapterMatches = beforeText.match(/chapter\s+(\d+)/gi)
    return chapterMatches ? chapterMatches.length : 1
  }

  /**
   * Generate character ID
   */
  private generateCharacterId(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  /**
   * Filter quotes by character
   */
  static filterByCharacter(quotes: EnhancedQuote[], characterId: string): EnhancedQuote[] {
    return quotes.filter(quote => quote.characterId === characterId)
  }

  /**
   * Filter quotes by sentiment
   */
  static filterBySentiment(
    quotes: EnhancedQuote[], 
    sentiment: 'positive' | 'negative' | 'neutral' | 'all' = 'all'
  ): EnhancedQuote[] {
    if (sentiment === 'all') return quotes
    
    return quotes.filter(quote => {
      if (sentiment === 'positive') return quote.sentimentScore > 0.5
      if (sentiment === 'negative') return quote.sentimentScore < -0.5
      return Math.abs(quote.sentimentScore) <= 0.5
    })
  }

  /**
   * Get sentiment distribution
   */
  static getSentimentDistribution(quotes: EnhancedQuote[]): {
    veryPositive: number
    positive: number
    neutral: number
    negative: number
    veryNegative: number
  } {
    const distribution = {
      veryPositive: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      veryNegative: 0
    }

    quotes.forEach(quote => {
      switch (quote.sentimentLabel) {
        case 'very positive': distribution.veryPositive++; break
        case 'positive': distribution.positive++; break
        case 'neutral': distribution.neutral++; break
        case 'negative': distribution.negative++; break
        case 'very negative': distribution.veryNegative++; break
      }
    })

    return distribution
  }
}
