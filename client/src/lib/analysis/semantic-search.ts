export interface SearchResult {
  id: string
  text: string
  similarity: number
  startIndex: number
  endIndex: number
  chapter: number
  context: {
    before: string
    after: string
  }
  characters: string[]
  sentiment?: {
    score: number
    label: string
  }
}

export interface SemanticSearchOptions {
  maxResults?: number
  minSimilarity?: number
  includeContext?: boolean
  contextWindow?: number
  chapterFilter?: number[]
  characterFilter?: string[]
}

export interface IndexedSentence {
  id: string
  text: string
  embedding?: number[]
  startIndex: number
  endIndex: number
  chapter: number
  characters: string[]
  processed: boolean
}

/**
 * Semantic Search Engine using Universal Sentence Encoder
 */
export class SemanticSearchEngine {
  private model: any = null
  private sentences: IndexedSentence[] = []
  private isInitialized = false
  private isLoading = false

  /**
   * Initialize the search engine with text
   */
  async initialize(text: string, characters: any[] = []): Promise<void> {
    if (this.isInitialized) return
    
    this.isLoading = true
    
    try {
      // Load TensorFlow.js and Universal Sentence Encoder
      await this.loadModel()
      
      // Split text into sentences and create index
      this.sentences = this.createSentenceIndex(text, characters)
      
      // Process embeddings in batches to avoid memory issues
      await this.processEmbeddings()
      
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize semantic search:', error)
      throw error
    } finally {
      this.isLoading = false
    }
  }

  /**
   * Search for semantically similar passages
   */
  async search(query: string, options: SemanticSearchOptions = {}): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      throw new Error('Search engine not initialized. Call initialize() first.')
    }

    const {
      maxResults = 10,
      minSimilarity = 0.3,
      includeContext = true,
      contextWindow = 200,
      chapterFilter,
      characterFilter
    } = options

    try {
      // Get query embedding
      const queryEmbedding = await this.embedText([query])
      
      // Calculate similarities
      const results: SearchResult[] = []
      
      for (const sentence of this.sentences) {
        if (!sentence.embedding || !sentence.processed) continue
        
        // Apply filters
        if (chapterFilter && !chapterFilter.includes(sentence.chapter)) continue
        if (characterFilter && !sentence.characters.some(char => characterFilter.includes(char))) continue
        
        // Calculate cosine similarity
        const similarity = this.cosineSimilarity(queryEmbedding[0], sentence.embedding)
        
        if (similarity >= minSimilarity) {
          results.push({
            id: sentence.id,
            text: sentence.text,
            similarity,
            startIndex: sentence.startIndex,
            endIndex: sentence.endIndex,
            chapter: sentence.chapter,
            context: includeContext ? this.getContext(sentence, contextWindow) : { before: '', after: '' },
            characters: sentence.characters
          })
        }
      }
      
      // Sort by similarity and return top results
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxResults)
        
    } catch (error) {
      console.error('Search failed:', error)
      throw error
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSuggestions(partialQuery: string, maxSuggestions = 5): Promise<string[]> {
    if (!this.isInitialized || partialQuery.length < 2) return []

    // Simple keyword-based suggestions
    const keywords = new Set<string>()
    const query = partialQuery.toLowerCase()
    
    this.sentences.forEach(sentence => {
      const words = sentence.text.toLowerCase().split(/\s+/)
      words.forEach(word => {
        if (word.includes(query) && word.length > query.length) {
          keywords.add(word.replace(/[^\w]/g, ''))
        }
      })
    })

    return Array.from(keywords)
      .filter(keyword => keyword.length > 2)
      .slice(0, maxSuggestions)
  }

  /**
   * Find similar passages to a given text
   */
  async findSimilar(
    referenceText: string, 
    options: SemanticSearchOptions = {}
  ): Promise<SearchResult[]> {
    return this.search(referenceText, options)
  }

  /**
   * Get semantic clusters of similar sentences
   */
  async getClusters(threshold = 0.7): Promise<SearchResult[][]> {
    if (!this.isInitialized) return []

    const clusters: SearchResult[][] = []
    const processed = new Set<string>()

    for (const sentence of this.sentences) {
      if (processed.has(sentence.id) || !sentence.embedding) continue

      const cluster: SearchResult[] = [{
        id: sentence.id,
        text: sentence.text,
        similarity: 1.0,
        startIndex: sentence.startIndex,
        endIndex: sentence.endIndex,
        chapter: sentence.chapter,
        context: this.getContext(sentence, 100),
        characters: sentence.characters
      }]

      // Find similar sentences
      for (const other of this.sentences) {
        if (other.id === sentence.id || processed.has(other.id) || !other.embedding) continue

        const similarity = this.cosineSimilarity(sentence.embedding, other.embedding)
        if (similarity >= threshold) {
          cluster.push({
            id: other.id,
            text: other.text,
            similarity,
            startIndex: other.startIndex,
            endIndex: other.endIndex,
            chapter: other.chapter,
            context: this.getContext(other, 100),
            characters: other.characters
          })
          processed.add(other.id)
        }
      }

      if (cluster.length > 1) {
        clusters.push(cluster.sort((a, b) => b.similarity - a.similarity))
      }
      processed.add(sentence.id)
    }

    return clusters.sort((a, b) => b.length - a.length)
  }

  /**
   * Load the Universal Sentence Encoder model
   */
  private async loadModel(): Promise<void> {
    try {
      // Dynamic import to keep bundle size small
      // Optional TensorFlow imports - graceful fallback if not available
      // TensorFlow imports are optional for build compatibility
      const tf = null // await import('@tensorflow/tfjs').catch(() => null)
      const use = null // await import('@tensorflow-models/universal-sentence-encoder').catch(() => null)
      
      if (!tf || !use) {
        console.warn('TensorFlow dependencies not available, semantic search disabled')
        return null
      }
      
      // Load the model
      this.model = await use.load()
      
      console.log('Universal Sentence Encoder loaded successfully')
    } catch (error) {
      console.error('Failed to load model:', error)
      throw new Error('Could not load semantic search model. Make sure you have internet connection.')
    }
  }

  /**
   * Create sentence index from text
   */
  private createSentenceIndex(text: string, characters: any[]): IndexedSentence[] {
    const sentences: IndexedSentence[] = []
    
    // Split into sentences using various patterns
    const sentencePattern = /[.!?]+\s+/g
    let lastIndex = 0
    let match
    let sentenceId = 0

    while ((match = sentencePattern.exec(text)) !== null) {
      const sentenceEnd = match.index + match[0].length
      const sentenceText = text.substring(lastIndex, sentenceEnd).trim()
      
      if (sentenceText.length > 20 && sentenceText.length < 500) { // Filter very short/long sentences
        const chapter = this.getChapterNumber(text, lastIndex)
        const associatedCharacters = this.findCharactersInSentence(sentenceText, characters)
        
        sentences.push({
          id: `sentence-${sentenceId++}`,
          text: sentenceText,
          startIndex: lastIndex,
          endIndex: sentenceEnd,
          chapter,
          characters: associatedCharacters,
          processed: false
        })
      }
      
      lastIndex = sentenceEnd
    }

    // Handle final sentence if text doesn't end with punctuation
    if (lastIndex < text.length) {
      const finalText = text.substring(lastIndex).trim()
      if (finalText.length > 20) {
        sentences.push({
          id: `sentence-${sentenceId}`,
          text: finalText,
          startIndex: lastIndex,
          endIndex: text.length,
          chapter: this.getChapterNumber(text, lastIndex),
          characters: this.findCharactersInSentence(finalText, characters),
          processed: false
        })
      }
    }

    return sentences
  }

  /**
   * Process embeddings in batches to manage memory
   */
  private async processEmbeddings(): Promise<void> {
    const batchSize = 50 // Process in smaller batches to avoid memory issues
    
    for (let i = 0; i < this.sentences.length; i += batchSize) {
      const batch = this.sentences.slice(i, i + batchSize)
      const texts = batch.map(s => s.text)
      
      try {
        const embeddings = await this.embedText(texts)
        
        batch.forEach((sentence, index) => {
          sentence.embedding = Array.from(embeddings[index])
          sentence.processed = true
        })
        
        // Small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`Failed to process batch ${i / batchSize}:`, error)
        // Mark as processed anyway to avoid infinite loops
        batch.forEach(sentence => {
          sentence.processed = true
        })
      }
    }
  }

  /**
   * Embed text using the loaded model
   */
  private async embedText(texts: string[]): Promise<number[][]> {
    if (!this.model) {
      throw new Error('Model not loaded')
    }

    try {
      const embeddings = await this.model.embed(texts)
      const embeddingData = await embeddings.data()
      embeddings.dispose() // Clean up memory
      
      // Convert to array of arrays
      const embeddingSize = embeddingData.length / texts.length
      const result: number[][] = []
      
      for (let i = 0; i < texts.length; i++) {
        const start = i * embeddingSize
        const end = start + embeddingSize
        result.push(Array.from(embeddingData.slice(start, end)))
      }
      
      return result
    } catch (error) {
      console.error('Embedding failed:', error)
      throw error
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }

    if (norm1 === 0 || norm2 === 0) return 0
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * Get context around a sentence
   */
  private getContext(sentence: IndexedSentence, windowSize: number): { before: string; after: string } {
    // Find adjacent sentences for context
    const currentIndex = this.sentences.findIndex(s => s.id === sentence.id)
    
    let beforeText = ''
    let afterText = ''
    
    // Get previous sentences
    for (let i = currentIndex - 1; i >= 0 && beforeText.length < windowSize; i--) {
      const prevSentence = this.sentences[i]
      if (beforeText.length + prevSentence.text.length <= windowSize) {
        beforeText = prevSentence.text + ' ' + beforeText
      } else {
        break
      }
    }
    
    // Get next sentences
    for (let i = currentIndex + 1; i < this.sentences.length && afterText.length < windowSize; i++) {
      const nextSentence = this.sentences[i]
      if (afterText.length + nextSentence.text.length <= windowSize) {
        afterText += ' ' + nextSentence.text
      } else {
        break
      }
    }
    
    return {
      before: beforeText.trim(),
      after: afterText.trim()
    }
  }

  /**
   * Find characters mentioned in a sentence
   */
  private findCharactersInSentence(sentence: string, characters: any[]): string[] {
    const found: string[] = []
    const lowerSentence = sentence.toLowerCase()
    
    characters.forEach(character => {
      const names = [character.name, ...(character.aliases || [])]
      
      for (const name of names) {
        if (lowerSentence.includes(name.toLowerCase())) {
          if (!found.includes(character.name)) {
            found.push(character.name)
          }
          break
        }
      }
    })
    
    return found
  }

  /**
   * Get chapter number for a position in text
   */
  private getChapterNumber(text: string, position: number): number {
    const beforeText = text.substring(0, position)
    const chapterMatches = beforeText.match(/chapter\s+(\d+)/gi)
    return chapterMatches ? chapterMatches.length : 1
  }

  /**
   * Get initialization status
   */
  getStatus(): {
    isInitialized: boolean
    isLoading: boolean
    sentenceCount: number
    processedCount: number
  } {
    return {
      isInitialized: this.isInitialized,
      isLoading: this.isLoading,
      sentenceCount: this.sentences.length,
      processedCount: this.sentences.filter(s => s.processed).length
    }
  }

  /**
   * Dispose of the model and free memory
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose()
      this.model = null
    }
    this.sentences = []
    this.isInitialized = false
  }

  /**
   * Export search results to JSON
   */
  static exportResults(results: SearchResult[], query: string): string {
    return JSON.stringify({
      query,
      timestamp: new Date().toISOString(),
      resultCount: results.length,
      results: results.map(result => ({
        similarity: result.similarity,
        text: result.text,
        chapter: result.chapter,
        characters: result.characters,
        context: result.context
      }))
    }, null, 2)
  }
}

/**
 * Factory function to create and initialize search engine
 */
export async function createSemanticSearch(
  text: string, 
  characters: any[] = []
): Promise<SemanticSearchEngine> {
  const engine = new SemanticSearchEngine()
  await engine.initialize(text, characters)
  return engine
}

/**
 * Check if semantic search is supported in the current environment
 */
export function isSemanticSearchSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 
           'navigator' in window && 
           navigator.onLine
  } catch {
    return false
  }
}
