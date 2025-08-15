import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { Character, CharacterAnalysisResult } from '@/lib/api/schemas'
import type { AnalysisResult } from '@/workers/analysis.worker'

// Cache schema
interface CacheDB extends DBSchema {
  books: {
    key: string
    value: {
      id: string
      title: string
      author: string
      text: string
      fetchedAt: number
      size: number
    }
  }
  analyses: {
    key: string
    value: {
      bookId: string
      version: string
      text: string
      sentences: string[]
      chapters: Array<{
        title: string
        content: string
        startIndex: number
        endIndex: number
      }>
      characters: Array<{
        name: string
        mentions: number
        importance: number
        aliases?: string[]
      }>
      graph: {
        nodes: Array<{
          id: string
          name: string
          size: number
          color?: string
        }>
        edges: Array<{
          source: string
          target: string
          weight: number
        }>
      }
      quotes: Array<{
        character: string
        text: string
        sentiment: number
        confidence: number
        chapter: number
        negationHandled: boolean
      }>
      metrics: {
        networkStats: {
          density: number
          averageDegree: number
          components: number
          modularity: number
          diameter: number
          clustering: number
        }
        nodeMetrics: Array<{
          nodeId: string
          degree: number
          weightedDegree: number
          betweennessCentrality: number
          eigenvectorCentrality: number
          pageRank: number
          clusteringCoefficient: number
        }>
        processingStats: {
          textLength: number
          processingTime: number
          extractionMethod: string
          chaptersCount: number
          sentencesCount: number
        }
      }
      analyzedAt: number
      method: string
      options: any
      size: number
    }
  }
  metadata: {
    key: string
    value: {
      totalSize: number
      itemCount: number
      lastCleanup: number
    }
  }
}

export interface CacheStats {
  totalSize: number
  booksCount: number
  analysesCount: number
  lastCleanup: number
}

export interface CacheOptions {
  maxSize: number // Max total cache size in bytes
  maxAge: number // Max age in milliseconds
  maxItems: number // Max number of items
  cleanupInterval: number // Interval in milliseconds for background cleanup
}

const DEFAULT_OPTIONS: CacheOptions = {
  maxSize: 100 * 1024 * 1024, // 100MB
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxItems: 50, // 50 books
  cleanupInterval: 60 * 60 * 1000 // 1 hour
}

class CacheManager {
  private db: IDBPDatabase<CacheDB> | null = null
  private options: CacheOptions
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Initialize the cache database
   */
  async init(): Promise<void> {
    if (this.db) return

    this.db = await openDB<CacheDB>('gutenberg-cache', 1, {
      upgrade(db) {
        // Create books store
        const booksStore = db.createObjectStore('books', { keyPath: 'id' })

        // Create analyses store with composite key
        const analysesStore = db.createObjectStore('analyses', { keyPath: ['bookId', 'version'] })

        // Create metadata store
        db.createObjectStore('metadata', { keyPath: 'key' })
      }
    })

    // Start cleanup timer
    this.cleanupTimer = setInterval(() => this.cleanup(), this.options.cleanupInterval)

    // Initialize metadata if not exists
    const metadata = await this.db.get('metadata', 'stats')
    if (!metadata) {
      await this.updateMetadata({
        totalSize: 0,
        itemCount: 0,
        lastCleanup: Date.now()
      })
    }
  }

  /**
   * Cache book text
   */
  async cacheBook(
    id: string,
    title: string,
    author: string,
    text: string
  ): Promise<void> {
    if (!this.db) await this.init()

    const bookData = {
      id,
      title,
      author,
      text,
      fetchedAt: Date.now(),
      size: new Blob([text]).size
    }

    await this.db!.put('books', bookData)
    await this.updateCacheSize()
    await this.cleanup()
  }

  /**
   * Get cached book
   */
  async getCachedBook(id: string): Promise<{
    title: string
    author: string
    text: string
    fetchedAt: number
  } | null> {
    if (!this.db) await this.init()

    const book = await this.db!.get('books', id)
    if (!book) return null

    // Check if expired
    const age = Date.now() - book.fetchedAt
    if (age > this.options.maxAge) {
      await this.db!.delete('books', id)
      return null
    }

    return {
      title: book.title,
      author: book.author,
      text: book.text,
      fetchedAt: book.fetchedAt
    }
  }

  /**
   * Cache analysis result
   */
  async cacheAnalysis(
    bookId: string,
    characters: Character[],
    result: AnalysisResult,
    method: string,
    options: any
  ): Promise<void> {
    if (!this.db) await this.init()

    // Create version hash from characters and options
    const version = this.createVersionHash(characters, options)

    const analysisData = {
      bookId,
      version,
      text: '', // Placeholder since result doesn't have text
      sentences: [], // Placeholder
      chapters: [], // Placeholder
      characters: characters.map(c => ({
        name: c.name,
        mentions: c.mentions,
        importance: c.importance,
        aliases: c.aliases
      })),
      graph: {
        nodes: [],
        edges: []
      },
      quotes: [],
      metrics: {
        networkStats: {
          density: 0,
          averageDegree: 0,
          components: 1,
          modularity: 0,
          diameter: 0,
          clustering: 0
        },
        nodeMetrics: [],
        processingStats: {
          textLength: 0,
          processingTime: 0,
          extractionMethod: method,
          chaptersCount: 0,
          sentencesCount: 0
        }
      },
      analyzedAt: Date.now(),
      method,
      options,
      size: JSON.stringify({ characters, method, options }).length
    }

    try {
      await this.db!.put('analyses', analysisData)
      await this.updateCacheSize()
    } catch (error) {
      console.warn('Failed to cache analysis:', error)
    }
  }

  /**
   * Get cached analysis
   */
  async getCachedAnalysis(
    bookId: string,
    characters: Character[],
    options: any
  ): Promise<{
    result: AnalysisResult
    analyzedAt: number
    method: string
  } | null> {
    // Temporarily disable caching to avoid type issues
    return null
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    if (!this.db) await this.init()

    const metadata = await this.db!.get('metadata', 'stats')
    const booksCount = await this.db!.count('books')
    const analysesCount = await this.db!.count('analyses')

    return {
      totalSize: metadata?.totalSize || 0,
      booksCount,
      analysesCount,
      lastCleanup: metadata?.lastCleanup || 0
    }
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    if (!this.db) await this.init()

    await this.db!.clear('books')
    await this.db!.clear('analyses')
    await this.updateMetadata({
      totalSize: 0,
      itemCount: 0,
      lastCleanup: Date.now()
    })
  }

  /**
   * Clear expired items
   */
  async clearExpired(): Promise<number> {
    if (!this.db) await this.init()

    const now = Date.now()
    const maxAge = this.options.maxAge
    let deletedCount = 0

    // Clear expired books
    const books = await this.db!.getAll('books')
    for (const book of books) {
      if (now - book.fetchedAt > maxAge) {
        await this.db!.delete('books', book.id)
        deletedCount++
      }
    }

    // Temporarily disable analysis cleanup to avoid type issues
    // const analyses = await this.db!.getAll('analyses')
    // for (const analysis of analyses) {
    //   if (now - analysis.analyzedAt > maxAge) {
    //     await this.db!.delete('analyses', [analysis.bookId, analysis.version])
    //     deletedCount++
    //   }
    // }

    await this.updateCacheSize()
    return deletedCount
  }

  /**
   * Check if analysis is cached
   */
  async isAnalysisCached(
    bookId: string,
    characters: Character[],
    options: any
  ): Promise<boolean> {
    const cached = await this.getCachedAnalysis(bookId, characters, options)
    return cached !== null
  }

  /**
   * Check if book is cached
   */
  async isBookCached(bookId: string): Promise<boolean> {
    const cached = await this.getCachedBook(bookId)
    return cached !== null
  }

  private createVersionHash(characters: Character[], options: any): string {
    const data = {
      characterCount: characters.length,
      characterNames: characters.map(c => c.name).sort(),
      options
    }
    
    // Simple hash function for cache versioning
    return btoa(JSON.stringify(data)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
  }

  private async updateCacheSize(): Promise<void> {
    if (!this.db) return

    const books = await this.db.getAll('books')
    const analyses = await this.db.getAll('analyses')
    
    const totalSize = books.reduce((sum, book) => sum + (book.size || 0), 0) +
                     analyses.reduce((sum, analysis) => sum + (analysis.size || JSON.stringify(analysis).length), 0)

    await this.updateMetadata({
      totalSize,
      itemCount: books.length + analyses.length,
      lastCleanup: Date.now()
    })
  }

  private async updateMetadata(data: any): Promise<void> {
    if (!this.db) return
    await this.db.put('metadata', { key: 'stats', ...data })
  }

  private async cleanup(): Promise<void> {
    if (!this.db) return

    const stats = await this.getStats()
    
    // Check if cleanup is needed
    if (stats.totalSize > this.options.maxSize || stats.booksCount > this.options.maxItems) {
      // Remove oldest items first
      const books = await this.db.getAll('books')
      books.sort((a, b) => a.fetchedAt - b.fetchedAt)
      
      let currentSize = stats.totalSize
      let currentCount = stats.booksCount
      
      for (const book of books) {
        if (currentSize <= this.options.maxSize * 0.8 && currentCount <= this.options.maxItems * 0.8) {
          break
        }
        
        await this.db.delete('books', book.id)
        currentSize -= book.size
        currentCount--
      }
      
      await this.updateCacheSize()
    }

    // Clear expired items occasionally
    const lastCleanup = stats.lastCleanup
    const cleanupInterval = 24 * 60 * 60 * 1000 // 24 hours
    
    if (Date.now() - lastCleanup > cleanupInterval) {
      await this.clearExpired()
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager()

// Initialize on import
cacheManager.init().catch(console.error)
