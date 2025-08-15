import { compress, decompress } from 'lz-string'
import { Character } from '@/lib/api/schemas'
import { GraphData } from '@/lib/graph/co-occurrence'
import { NetworkMetrics, NetworkStats } from '@/lib/analysis/network-metrics'
import { EnhancedQuote } from '@/lib/analysis/enhanced-sentiment'
import { ChapterTopic } from '@/lib/analysis/topic-analysis'

export interface ShareableState {
  // Book information
  bookId: string
  bookTitle: string
  bookAuthor: string
  
  // Analysis results
  characters: Character[]
  graphData: GraphData
  networkMetrics: NetworkMetrics[]
  networkStats: NetworkStats
  quotes: EnhancedQuote[]
  chapterTopics: ChapterTopic[]
  
  // UI state
  selectedCharacter?: string
  graphMode?: string
  graphSettings?: {
    sentenceWindow: number
    minEdgeWeight: number
    showLabels: boolean
    nodeSize: number
    linkWidth: number
  }
  
  // Analysis metadata
  analysisDate: string
  version: string
  stats: {
    processingTime: number
    textLength: number
    chaptersCount: number
    extractionMethod: string
  }
}

export interface ShareOptions {
  includeFullText?: boolean
  includeQuotes?: boolean
  includeTopics?: boolean
  includeMetrics?: boolean
  maxQuotes?: number
  compressionLevel?: 'fast' | 'balanced' | 'max'
}

export class StateManager {
  private static readonly VERSION = '2.0.0'
  private static readonly MAX_URL_LENGTH = 2000 // Conservative URL length limit

  /**
   * Create shareable state from current analysis
   */
  static createShareableState(
    analysisData: {
      bookId?: string
      bookTitle?: string
      bookAuthor?: string
      characters?: Character[]
      graphData?: GraphData
      networkMetrics?: NetworkMetrics[]
      networkStats?: NetworkStats
      enhancedQuotes?: EnhancedQuote[]
      chapterTopics?: ChapterTopic[]
      stats?: {
        processingTime?: number
        textLength?: number
        chaptersCount?: number
        extractionMethod?: string
      }
    },
    uiState: {
      selectedCharacter?: string
      graphMode?: string
      graphSettings?: {
        sentenceWindow: number
        minEdgeWeight: number
        showLabels: boolean
        nodeSize: number
        linkWidth: number
      }
    } = {},
    options: ShareOptions = {}
  ): ShareableState {
    const opts = {
      includeQuotes: true,
      includeTopics: true,
      includeMetrics: true,
      maxQuotes: 20,
      compressionLevel: 'balanced' as const,
      ...options
    }

    // Filter quotes if needed
    let quotes = analysisData.enhancedQuotes || []
    if (opts.maxQuotes && quotes.length > opts.maxQuotes) {
      quotes = quotes
        .sort((a: EnhancedQuote, b: EnhancedQuote) => Math.abs(b.sentimentScore) - Math.abs(a.sentimentScore))
        .slice(0, opts.maxQuotes)
    }

    const state: ShareableState = {
      // Book info
      bookId: analysisData.bookId || '',
      bookTitle: analysisData.bookTitle || '',
      bookAuthor: analysisData.bookAuthor || '',
      
      // Core analysis data
      characters: analysisData.characters || [],
      graphData: analysisData.graphData || { nodes: [], edges: [] },
      
      // Optional data based on options
      networkMetrics: opts.includeMetrics ? (analysisData.networkMetrics || []) : [],
      networkStats: opts.includeMetrics ? (analysisData.networkStats || {
        nodeCount: 0,
        edgeCount: 0,
        density: 0,
        averageDegree: 0,
        averageClustering: 0,
        diameter: 0,
        radius: 0,
        components: 1,
        modularity: 0
      }) : {
        nodeCount: 0,
        edgeCount: 0,
        density: 0,
        averageDegree: 0,
        averageClustering: 0,
        diameter: 0,
        radius: 0,
        components: 1,
        modularity: 0
      },
      quotes: opts.includeQuotes ? quotes : [],
      chapterTopics: opts.includeTopics ? (analysisData.chapterTopics || []) : [],
      
      // UI state
      selectedCharacter: uiState.selectedCharacter,
      graphMode: uiState.graphMode,
      graphSettings: uiState.graphSettings,
      
      // Metadata
      analysisDate: new Date().toISOString(),
      version: this.VERSION,
      stats: {
        processingTime: analysisData.stats?.processingTime || 0,
        textLength: analysisData.stats?.textLength || 0,
        chaptersCount: analysisData.stats?.chaptersCount || 0,
        extractionMethod: analysisData.stats?.extractionMethod || 'manual'
      }
    }

    return state
  }

  /**
   * Compress and encode state for URL sharing
   */
  static compressState(state: ShareableState, options: ShareOptions = {}): string {
    try {
      // Optimize state for compression
      const optimizedState = this.optimizeForCompression(state, options)
      
      // Convert to JSON
      const jsonString = JSON.stringify(optimizedState)
      
      // Compress using lz-string
      let compressed: string
      switch (options.compressionLevel) {
        case 'fast':
          compressed = compress(jsonString)
          break
        case 'max':
          compressed = compress(jsonString) // lz-string doesn't have levels, but we could implement our own
          break
        case 'balanced':
        default:
          compressed = compress(jsonString)
          break
      }
      
      // Base64 encode for URL safety
      const encoded = btoa(compressed)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      
      return encoded
    } catch (error) {
      console.error('Failed to compress state:', error)
      throw new Error('State compression failed')
    }
  }

  /**
   * Decompress and decode state from URL
   */
  static decompressState(compressed: string): ShareableState | null {
    try {
      // Decode from URL-safe base64
      const padded = compressed + '='.repeat((4 - compressed.length % 4) % 4)
      const decoded = padded.replace(/-/g, '+').replace(/_/g, '/')
      const decompressed = decompress(atob(decoded))
      
      if (!decompressed) {
        throw new Error('Decompression failed')
      }
      
      // Parse JSON
      const state = JSON.parse(decompressed) as ShareableState
      
      // Validate state structure
      if (!this.validateState(state)) {
        throw new Error('Invalid state structure')
      }
      
      return state
    } catch (error) {
      console.error('Failed to decompress state:', error)
      return null
    }
  }

  /**
   * Generate shareable URL
   */
  static generateShareURL(state: ShareableState, options: ShareOptions = {}): string {
    const compressed = this.compressState(state, options)
    const baseUrl = window.location.origin + window.location.pathname
    const shareUrl = `${baseUrl}#share=${compressed}`
    
    // Check URL length
    if (shareUrl.length > this.MAX_URL_LENGTH) {
      console.warn('Generated URL is very long, consider reducing data')
    }
    
    return shareUrl
  }

  /**
   * Extract state from current URL
   */
  static getStateFromURL(): ShareableState | null {
    const hash = window.location.hash
    const shareMatch = hash.match(/#share=([^&]+)/)
    
    if (shareMatch) {
      return this.decompressState(shareMatch[1])
    }
    
    return null
  }

  /**
   * Update URL with current state
   */
  static updateURL(state: ShareableState, options: ShareOptions = {}): void {
    const compressed = this.compressState(state, options)
    const newUrl = `${window.location.pathname}#share=${compressed}`
    
    // Update URL without triggering page reload
    window.history.replaceState(null, '', newUrl)
  }

  /**
   * Copy share URL to clipboard
   */
  static async copyShareURL(state: ShareableState, options: ShareOptions = {}): Promise<boolean> {
    try {
      const shareUrl = this.generateShareURL(state, options)
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = shareUrl
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }

  /**
   * Optimize state for better compression
   */
  private static optimizeForCompression(state: ShareableState, options: ShareOptions): any {
    const optimized = { ...state }
    
    // Use shorter property names
    const compressed = {
      // Book info (1-2 char keys)
      i: optimized.bookId,
      t: optimized.bookTitle,
      a: optimized.bookAuthor,
      
      // Characters (shortened)
      c: optimized.characters.map(char => ({
        n: char.name,
        m: char.mentions,
        i: char.importance
      })),
      
      // Graph data (shortened)
      g: {
        n: optimized.graphData.nodes.map(node => ({
          i: node.id,
          n: node.name,
          s: node.size,
          c: node.color
        })),
        e: optimized.graphData.edges.map(edge => ({
          s: edge.source,
          t: edge.target,
          w: edge.weight
        }))
      },
      
      // Network stats (essential only)
      ns: options.includeMetrics ? {
        d: Math.round(optimized.networkStats.density * 1000) / 1000,
        ad: Math.round(optimized.networkStats.averageDegree * 100) / 100,
        c: optimized.networkStats.components,
        m: Math.round(optimized.networkStats.modularity * 1000) / 1000
      } : null,
      
      // Quotes (top sentiment only)
      q: options.includeQuotes ? optimized.quotes.map(quote => ({
        c: quote.character,
        t: quote.text.substring(0, 200), // Limit text length
        s: Math.round(quote.sentimentScore * 100) / 100,
        ch: quote.chapter
      })) : null,
      
      // Topics (keywords only)
      tp: options.includeTopics ? optimized.chapterTopics.map(topic => ({
        c: topic.chapterNumber,
        k: topic.topTerms.slice(0, 5).map(t => t.term) // Top 5 terms only
      })) : null,
      
      // UI state
      ui: {
        sc: optimized.selectedCharacter,
        gm: optimized.graphMode,
        gs: optimized.graphSettings
      },
      
      // Metadata (minimal)
      v: optimized.version,
      d: optimized.analysisDate.substring(0, 10), // Date only
      st: {
        pt: optimized.stats.processingTime,
        tl: optimized.stats.textLength,
        cc: optimized.stats.chaptersCount,
        em: optimized.stats.extractionMethod
      }
    }
    
    // Remove null values
    Object.keys(compressed).forEach(key => {
      if (compressed[key as keyof typeof compressed] === null || compressed[key as keyof typeof compressed] === undefined) {
        delete compressed[key as keyof typeof compressed]
      }
    })
    
    return compressed
  }

  /**
   * Validate state structure
   */
  private static validateState(state: any): boolean {
    if (!state || typeof state !== 'object') return false
    
    // Check for required fields (in compressed format)
    const required = ['i', 't', 'c', 'g']
    return required.every(field => state.hasOwnProperty(field))
  }

  /**
   * Restore state from compressed format
   */
  static restoreState(compressed: any): ShareableState {
    return {
      bookId: compressed.i || '',
      bookTitle: compressed.t || '',
      bookAuthor: compressed.a || '',
      
      characters: (compressed.c || []).map((c: any) => ({
        name: c.n,
        mentions: c.m,
        importance: c.i
      })),
      
      graphData: {
        nodes: (compressed.g?.n || []).map((n: any) => ({
          id: n.i,
          name: n.n,
          size: n.s,
          color: n.c
        })),
        edges: (compressed.g?.e || []).map((e: any) => ({
          source: e.s,
          target: e.t,
          weight: e.w
        }))
      },
      
      networkMetrics: [], // Can be recalculated
      networkStats: compressed.ns ? {
        nodeCount: 0,
        edgeCount: 0,
        density: compressed.ns.d,
        averageDegree: compressed.ns.ad,
        averageClustering: 0,
        diameter: 0,
        radius: 0,
        components: compressed.ns.c,
        modularity: compressed.ns.m
      } : {
        nodeCount: 0,
        edgeCount: 0,
        density: 0,
        averageDegree: 0,
        averageClustering: 0,
        diameter: 0,
        radius: 0,
        components: 1,
        modularity: 0
      },
      
      quotes: (compressed.q || []).map((q: any) => ({
        character: q.c,
        text: q.t,
        sentiment: q.s,
        confidence: 0.8,
        chapter: q.ch,
        negationHandled: false
      })),
      
      chapterTopics: (compressed.tp || []).map((t: any) => ({
        chapter: t.c,
        keywords: t.k,
        scores: {}
      })),
      
      selectedCharacter: compressed.ui?.sc,
      graphMode: compressed.ui?.gm,
      graphSettings: compressed.ui?.gs,
      
      analysisDate: compressed.d + 'T00:00:00.000Z',
      version: compressed.v || '1.0.0',
      stats: compressed.st || {
        processingTime: 0,
        textLength: 0,
        chaptersCount: 0,
        extractionMethod: 'manual'
      }
    }
  }

  /**
   * Get compression statistics
   */
  static getCompressionStats(state: ShareableState): {
    originalSize: number
    compressedSize: number
    compressionRatio: number
    urlLength: number
  } {
    const originalJson = JSON.stringify(state)
    const compressed = this.compressState(state)
    const url = this.generateShareURL(state)
    
    return {
      originalSize: originalJson.length,
      compressedSize: compressed.length,
      compressionRatio: Math.round((1 - compressed.length / originalJson.length) * 100),
      urlLength: url.length
    }
  }
}
