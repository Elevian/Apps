export interface StreamProgress {
  bytesLoaded: number
  bytesTotal: number | null
  percentage: number
  speed: number // bytes per second
  timeRemaining: number | null // seconds
  chunks: number
}

export interface StreamOptions {
  onProgress?: (progress: StreamProgress) => void
  onChunk?: (chunk: string, accumulated: string) => void
  chunkSize?: number
  signal?: AbortSignal
}

export class StreamingTextFetcher {
  private startTime: number = 0
  private lastUpdate: number = 0
  private bytesLoaded: number = 0

  /**
   * Fetch text with streaming and progress tracking
   */
  async fetchText(url: string, options: StreamOptions = {}): Promise<string> {
    const {
      onProgress,
      onChunk,
      chunkSize = 8192, // 8KB chunks
      signal
    } = options

    this.startTime = Date.now()
    this.lastUpdate = this.startTime
    this.bytesLoaded = 0

    try {
      const response = await fetch(url, { signal })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentLength = response.headers.get('content-length')
      const bytesTotal = contentLength ? parseInt(contentLength) : null
      
      if (!response.body) {
        // Fallback to regular fetch if streaming not supported
        const text = await response.text()
        onProgress?.({
          bytesLoaded: text.length,
          bytesTotal: text.length,
          percentage: 100,
          speed: 0,
          timeRemaining: 0,
          chunks: 1
        })
        return text
      }

      return this.streamReader(response.body, bytesTotal, {
        onProgress,
        onChunk,
        chunkSize,
        signal
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Download was cancelled')
      }
      throw error
    }
  }

  /**
   * Stream reader with incremental processing
   */
  private async streamReader(
    stream: ReadableStream<Uint8Array>,
    bytesTotal: number | null,
    options: StreamOptions
  ): Promise<string> {
    const { onProgress, onChunk, signal } = options
    const decoder = new TextDecoder()
    const reader = stream.getReader()
    
    let accumulated = ''
    let chunks = 0
    
    try {
      while (true) {
        // Check for cancellation
        if (signal?.aborted) {
          throw new Error('Download was cancelled')
        }

        const { done, value } = await reader.read()
        
        if (done) break
        
        // Update progress tracking
        this.bytesLoaded += value.length
        chunks++
        
        // Decode chunk
        const chunkText = decoder.decode(value, { stream: true })
        accumulated += chunkText
        
        // Report chunk progress
        onChunk?.(chunkText, accumulated)
        
        // Throttle progress updates (max 10 per second)
        const now = Date.now()
        if (now - this.lastUpdate > 100) {
          this.lastUpdate = now
          
          const progress = this.calculateProgress(bytesTotal, chunks, now)
          onProgress?.(progress)
        }
      }
      
      // Final progress update
      const finalProgress = this.calculateProgress(bytesTotal, chunks, Date.now())
      onProgress?.(finalProgress)
      
      return accumulated
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Calculate streaming progress metrics
   */
  private calculateProgress(
    bytesTotal: number | null,
    chunks: number,
    currentTime: number
  ): StreamProgress {
    const elapsed = (currentTime - this.startTime) / 1000 // seconds
    const speed = elapsed > 0 ? this.bytesLoaded / elapsed : 0
    
    let percentage = 0
    let timeRemaining: number | null = null
    
    if (bytesTotal) {
      percentage = Math.round((this.bytesLoaded / bytesTotal) * 100)
      
      if (speed > 0) {
        const remainingBytes = bytesTotal - this.bytesLoaded
        timeRemaining = remainingBytes / speed
      }
    }
    
    return {
      bytesLoaded: this.bytesLoaded,
      bytesTotal,
      percentage,
      speed,
      timeRemaining,
      chunks
    }
  }
}

/**
 * Chunked text processor for incremental parsing
 */
export class ChunkedTextProcessor {
  private buffer: string = ''
  private sentenceCount: number = 0
  private wordCount: number = 0
  private chapterCount: number = 0
  
  constructor(
    private onSentence?: (sentence: string, count: number) => void,
    private onChapter?: (chapter: string, count: number) => void,
    private onProgress?: (stats: { sentences: number; words: number; chapters: number }) => void
  ) {}

  /**
   * Process text chunk incrementally
   */
  processChunk(chunk: string): void {
    this.buffer += chunk
    
    // Extract complete sentences
    this.processSentences()
    
    // Check for chapter boundaries
    this.processChapters()
    
    // Update word count
    this.updateWordCount(chunk)
    
    // Report progress
    this.onProgress?.({
      sentences: this.sentenceCount,
      words: this.wordCount,
      chapters: this.chapterCount
    })
  }

  /**
   * Get final processing results
   */
  finalize(): {
    sentences: number
    words: number
    chapters: number
    remainingText: string
  } {
    // Process any remaining buffer
    if (this.buffer.trim()) {
      this.onSentence?.(this.buffer.trim(), ++this.sentenceCount)
    }
    
    return {
      sentences: this.sentenceCount,
      words: this.wordCount,
      chapters: this.chapterCount,
      remainingText: this.buffer
    }
  }

  private processSentences(): void {
    const sentenceEndings = /[.!?]+\s+/g
    let match
    let lastIndex = 0
    
    while ((match = sentenceEndings.exec(this.buffer)) !== null) {
      const sentence = this.buffer.substring(lastIndex, match.index + match[0].length).trim()
      
      if (sentence.length > 10) { // Filter very short sentences
        this.onSentence?.(sentence, ++this.sentenceCount)
      }
      
      lastIndex = match.index + match[0].length
    }
    
    // Keep unprocessed text in buffer
    this.buffer = this.buffer.substring(lastIndex)
  }

  private processChapters(): void {
    const chapterPatterns = [
      /^CHAPTER\s+[IVXLCDM\d]+/gmi,
      /^Chapter\s+\d+/gmi,
      /^[IVXLCDM]+\.\s/gmi
    ]
    
    for (const pattern of chapterPatterns) {
      if (pattern.test(this.buffer)) {
        this.chapterCount++
        this.onChapter?.(this.buffer, this.chapterCount)
        break
      }
    }
  }

  private updateWordCount(chunk: string): void {
    const words = chunk.match(/\b\w+\b/g)
    if (words) {
      this.wordCount += words.length
    }
  }
}

/**
 * Create a streaming book fetcher with caching
 */
export async function createStreamingFetcher(
  url: string,
  options: StreamOptions = {}
): Promise<{
  text: string
  stats: {
    totalTime: number
    averageSpeed: number
    chunks: number
    streamingSupported: boolean
  }
}> {
  const fetcher = new StreamingTextFetcher()
  const startTime = Date.now()
  let chunks = 0
  let streamingSupported = true
  
  try {
    const text = await fetcher.fetchText(url, {
      ...options,
      onProgress: (progress) => {
        chunks = progress.chunks
        options.onProgress?.(progress)
      }
    })
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    const averageSpeed = text.length / (totalTime / 1000) // bytes per second
    
    return {
      text,
      stats: {
        totalTime,
        averageSpeed,
        chunks,
        streamingSupported
      }
    }
  } catch (error) {
    // If streaming fails, fall back to regular fetch
    if (error instanceof Error && !error.message.includes('cancelled')) {
      console.warn('Streaming failed, falling back to regular fetch:', error.message)
      streamingSupported = false
      
      const response = await fetch(url, { signal: options.signal })
      const text = await response.text()
      const endTime = Date.now()
      
      return {
        text,
        stats: {
          totalTime: endTime - startTime,
          averageSpeed: text.length / ((endTime - startTime) / 1000),
          chunks: 1,
          streamingSupported: false
        }
      }
    }
    
    throw error
  }
}
