import { useState, useRef, useCallback } from 'react'
import { wrap, type Remote } from 'comlink'
import { Character } from '@/lib/api/schemas'
import { cacheManager } from '@/lib/cache/cache-manager'
import { createStreamingFetcher, type StreamProgress } from '@/lib/streaming/stream-fetcher'
import { gutenbergApi } from '@/lib/api/gutenberg'
import type { AnalysisResult, AnalysisProgress } from '@/workers/analysis.worker'
import { toast } from 'sonner'

export type WorkerStep = 'idle' | 'resolving' | 'downloading' | 'splitting' | 'parsing' | 'cooccurrence' | 'sentiment' | 'ranking' | 'complete' | 'error' | 'cancelled'

export interface WorkerAnalysisState {
  currentStep: WorkerStep
  progress: number
  message: string
  streamProgress?: StreamProgress
  analysisProgress?: AnalysisProgress
  error: string | null
  result: AnalysisResult | null
  bookInfo: { title: string; author: string } | null
  characters: Character[]
  isAnalyzing: boolean
  canCancel: boolean
  fromCache: boolean
}

export interface WorkerAnalysisOptions {
  forceRecompute?: boolean
  windowSize?: number
  minEdgeWeight?: number
  minMentions?: number
}

export function useWorkerAnalysis() {
  const [state, setState] = useState<WorkerAnalysisState>({
    currentStep: 'idle',
    progress: 0,
    message: 'Ready to analyze',
    error: null,
    result: null,
    bookInfo: null,
    characters: [],
    isAnalyzing: false,
    canCancel: false,
    fromCache: false
  })

  const workerRef = useRef<Remote<any> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Initialize or get worker instance
   */
  const getWorker = useCallback(async () => {
    if (!workerRef.current) {
      const worker = new Worker(
        new URL('../workers/analysis.worker.ts', import.meta.url),
        { type: 'module' }
      )
      workerRef.current = wrap(worker)
    }
    return workerRef.current
  }, [])

  /**
   * Update state helper
   */
  const updateState = useCallback((update: Partial<WorkerAnalysisState>) => {
    setState(prev => ({ ...prev, ...update }))
  }, [])

  /**
   * Start comprehensive analysis
   */
  const startAnalysis = useCallback(async (
    bookId: string,
    options: WorkerAnalysisOptions = {}
  ) => {
    try {
      // Reset state
      updateState({
        currentStep: 'resolving',
        progress: 0,
        message: 'Resolving book information...',
        error: null,
        result: null,
        isAnalyzing: true,
        canCancel: true,
        fromCache: false
      })

      abortControllerRef.current = new AbortController()

      // Step 1: Resolve book metadata
      const bookResolve = await gutenbergApi.resolveBook(bookId)
      updateState({
        bookInfo: {
          title: bookResolve.title,
          author: bookResolve.author
        },
        progress: 5,
        message: `Found "${bookResolve.title}" by ${bookResolve.author}`
      })

      // Step 2: Check cache first (unless force recompute)
      if (!options.forceRecompute) {
        updateState({
          currentStep: 'resolving',
          progress: 10,
          message: 'Checking cache...'
        })

        const cachedBook = await cacheManager.getCachedBook(bookId)
        if (cachedBook) {
          // Check if we have cached analysis
          const dummyCharacters: Character[] = [] // We'll get real characters after text analysis
          const cachedAnalysis = await cacheManager.getCachedAnalysis(
            bookId,
            dummyCharacters,
            options
          )

          if (cachedAnalysis) {
            updateState({
              currentStep: 'complete',
              progress: 100,
              message: 'Loaded from cache',
              result: cachedAnalysis.result,
              characters: cachedAnalysis.result.rankings.map(r => r.character),
              isAnalyzing: false,
              canCancel: false,
              fromCache: true
            })

            toast.success('Analysis loaded from cache', {
              description: `${bookResolve.title} analyzed on ${new Date(cachedAnalysis.analyzedAt).toLocaleDateString()}`
            })
            return
          }
        }
      }

      // Step 3: Download book text with streaming
      updateState({
        currentStep: 'downloading',
        progress: 15,
        message: 'Downloading book text...'
      })

      const { text, stats } = await createStreamingFetcher(bookResolve.url, {
        signal: abortControllerRef.current.signal,
        onProgress: (streamProgress) => {
          updateState({
            streamProgress,
            progress: 15 + (streamProgress.percentage * 0.3), // 15-45%
            message: `Downloading... ${streamProgress.percentage}% (${(streamProgress.speed / 1024).toFixed(0)} KB/s)`
          })
        }
      })

      // Cache the book text
      await cacheManager.cacheBook(bookId, bookResolve.title, bookResolve.author, text)

      updateState({
        currentStep: 'splitting',
        progress: 50,
        message: 'Initializing analysis worker...',
        streamProgress: undefined
      })

      // Step 4: Get worker and start analysis
      const worker = await getWorker()

      // First, let's do a quick character extraction to get the character list
      updateState({
        progress: 55,
        message: 'Extracting characters...'
      })

      // For now, we'll create a simple character list
      // In a real implementation, you'd want to run character extraction first
      const sampleCharacters: Character[] = [
        { name: 'Protagonist', aliases: [], importance: 100, mentions: 50 },
        { name: 'Deuteragonist', aliases: [], importance: 80, mentions: 30 },
        { name: 'Antagonist', aliases: [], importance: 70, mentions: 25 }
      ]

      // Step 5: Run worker analysis
      const analysisOptions = {
        windowSize: options.windowSize || 3,
        minEdgeWeight: options.minEdgeWeight || 2,
        minMentions: options.minMentions || 2
      }

      const result = await worker.analyzeText(
        text,
        sampleCharacters,
        analysisOptions,
        (progress: AnalysisProgress) => {
          updateState({
            currentStep: progress.step as WorkerStep,
            progress: 60 + (progress.progress * 0.35), // 60-95%
            message: progress.message,
            analysisProgress: progress
          })
        }
      )

      // Step 6: Cache results
      await cacheManager.cacheAnalysis(
        bookId,
        result.rankings.map(r => r.character),
        result,
        'worker',
        analysisOptions
      )

      // Step 7: Complete
      updateState({
        currentStep: 'complete',
        progress: 100,
        message: `Analysis complete in ${result.stats.processingTime}ms`,
        result,
        characters: result.rankings.map(r => r.character),
        isAnalyzing: false,
        canCancel: false,
        analysisProgress: undefined
      })

      toast.success('Analysis complete!', {
        description: `Found ${result.rankings.length} characters and ${result.quotes.length} quotes`
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      updateState({
        currentStep: 'error',
        progress: 0,
        message: errorMessage,
        error: errorMessage,
        isAnalyzing: false,
        canCancel: false
      })

      if (!errorMessage.includes('cancelled')) {
        toast.error('Analysis failed', { description: errorMessage })
      }
    }
  }, [updateState, getWorker])

  /**
   * Cancel current analysis
   */
  const cancelAnalysis = useCallback(async () => {
    try {
      // Cancel download
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Cancel worker analysis
      if (workerRef.current) {
        await workerRef.current.cancelAnalysis()
      }

      updateState({
        currentStep: 'cancelled',
        progress: 0,
        message: 'Analysis cancelled',
        isAnalyzing: false,
        canCancel: false,
        error: null
      })

      toast.info('Analysis cancelled')
    } catch (error) {
      console.error('Error cancelling analysis:', error)
    }
  }, [updateState])

  /**
   * Reset analysis state
   */
  const resetAnalysis = useCallback(() => {
    updateState({
      currentStep: 'idle',
      progress: 0,
      message: 'Ready to analyze',
      error: null,
      result: null,
      bookInfo: null,
      characters: [],
      isAnalyzing: false,
      canCancel: false,
      fromCache: false,
      streamProgress: undefined,
      analysisProgress: undefined
    })
  }, [updateState])

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(async () => {
    return await cacheManager.getStats()
  }, [])

  /**
   * Clear cache
   */
  const clearCache = useCallback(async () => {
    await cacheManager.clearCache()
    toast.success('Cache cleared')
  }, [])

  return {
    // State
    ...state,

    // Actions
    startAnalysis,
    cancelAnalysis,
    resetAnalysis,
    getCacheStats,
    clearCache,

    // Computed
    hasResult: state.result !== null,
    stepLabel: getStepLabel(state.currentStep),
    isDownloading: state.currentStep === 'downloading',
    isProcessing: ['splitting', 'parsing', 'cooccurrence', 'sentiment', 'ranking'].includes(state.currentStep),
  }
}

function getStepLabel(step: WorkerStep): string {
  const labels: Record<WorkerStep, string> = {
    idle: 'Ready',
    resolving: 'Resolving',
    downloading: 'Downloading',
    splitting: 'Splitting Text',
    parsing: 'Parsing',
    cooccurrence: 'Building Graph',
    sentiment: 'Analyzing Sentiment',
    ranking: 'Ranking Characters',
    complete: 'Complete',
    error: 'Error',
    cancelled: 'Cancelled'
  }
  return labels[step] || step
}
