import { useState, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useGutenbergText } from './use-gutenberg'
import { analysisApi } from '@/lib/api/gutenberg'
import { CharacterAnalysisResult, CharacterAnalysisRequest } from '@/lib/api/schemas'
import { toast } from 'sonner'

export type AnalysisStep = 'idle' | 'fetch' | 'parse' | 'characters' | 'graph' | 'insights' | 'complete' | 'error'

export type AnalysisMode = 'auto' | 'ollama'

export interface AnalysisPipelineState {
  currentStep: AnalysisStep
  bookId: string | null
  mode: AnalysisMode
  progress: number
  error: string | null
  characterResults: CharacterAnalysisResult | null
}

export interface AnalysisPipelineControls {
  startAnalysis: (bookId: string, mode: AnalysisMode) => void
  resetAnalysis: () => void
  isAnalyzing: boolean
  canRetry: boolean
}

const STEP_PROGRESS: Record<AnalysisStep, number> = {
  idle: 0,
  fetch: 20,
  parse: 40,
  characters: 60,
  graph: 80,
  insights: 90,
  complete: 100,
  error: 0,
}

const STEP_LABELS: Record<AnalysisStep, string> = {
  idle: 'Ready',
  fetch: 'Fetching Book',
  parse: 'Parsing Text',
  characters: 'Analyzing Characters',
  graph: 'Building Graph',
  insights: 'Generating Insights',
  complete: 'Complete',
  error: 'Error',
}

export function useAnalysisPipeline(): AnalysisPipelineState & AnalysisPipelineControls {
  const [state, setState] = useState<AnalysisPipelineState>({
    currentStep: 'idle',
    bookId: null,
    mode: 'auto',
    progress: 0,
    error: null,
    characterResults: null,
  })

  // Check analysis health on mount
  const { data: analysisHealth } = useQuery({
    queryKey: ['analysis', 'health'],
    queryFn: () => analysisApi.getHealth(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch book text (step 1-2)
  const {
    text: bookText,
    resolve: bookInfo,
    isLoading: isFetchingText,
    error: fetchError,
    refetch: refetchText,
  } = useGutenbergText(state.bookId, state.currentStep === 'fetch')

  // Character analysis mutation (step 3)
  const characterAnalysisMutation = useMutation({
    mutationFn: (request: CharacterAnalysisRequest) => analysisApi.analyzeCharacters(request),
    onSuccess: (result) => {
      setState(prev => ({
        ...prev,
        currentStep: 'graph',
        progress: STEP_PROGRESS.graph,
        characterResults: result,
        error: null,
      }))

      toast.success('Character analysis complete!', {
        description: `Found ${result.total_characters} characters using ${result.method}`
      })

      // Simulate graph generation
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          currentStep: 'insights',
          progress: STEP_PROGRESS.insights,
        }))

        // Simulate insights generation
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            currentStep: 'complete',
            progress: STEP_PROGRESS.complete,
          }))

          toast.success('Analysis pipeline complete!', {
            description: 'Results are now available in the Graph and Insights sections.'
          })
        }, 1000)
      }, 1500)
    },
    onError: (error) => {
      setState(prev => ({
        ...prev,
        currentStep: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Character analysis failed',
      }))

      toast.error('Character analysis failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    },
  })

  // Main pipeline orchestration
  const startAnalysis = useCallback(async (bookId: string, mode: AnalysisMode) => {
    // Save to localStorage
    localStorage.setItem('lastBookId', bookId)
    localStorage.setItem('lastMode', mode)

    setState({
      currentStep: 'fetch',
      bookId,
      mode,
      progress: STEP_PROGRESS.fetch,
      error: null,
      characterResults: null,
    })

    toast.info('Starting analysis pipeline...', {
      description: `Analyzing book ${bookId} using ${mode} mode`
    })
  }, [])

  const resetAnalysis = useCallback(() => {
    setState({
      currentStep: 'idle',
      bookId: null,
      mode: 'auto',
      progress: 0,
      error: null,
      characterResults: null,
    })
    characterAnalysisMutation.reset()
  }, [characterAnalysisMutation])

  // Handle text fetch completion
  if (state.currentStep === 'fetch' && bookText && !isFetchingText) {
    setState(prev => ({
      ...prev,
      currentStep: 'parse',
      progress: STEP_PROGRESS.parse,
    }))

    // Simulate parsing step
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentStep: 'characters',
        progress: STEP_PROGRESS.characters,
      }))

      // Start character analysis
      if (bookText.text) {
        characterAnalysisMutation.mutate({
          text: bookText.text,
          mode: state.mode,
          max_characters: 20,
        })
      }
    }, 800)
  }

  // Handle fetch errors
  if (state.currentStep === 'fetch' && fetchError) {
    setState(prev => ({
      ...prev,
      currentStep: 'error',
      progress: 0,
      error: fetchError instanceof Error ? fetchError.message : 'Failed to fetch book text',
    }))

    toast.error('Failed to fetch book', {
      description: fetchError instanceof Error ? fetchError.message : 'Unknown error occurred'
    })
  }

  const isAnalyzing = state.currentStep !== 'idle' && 
                    state.currentStep !== 'complete' && 
                    state.currentStep !== 'error'

  const canRetry = state.currentStep === 'error'

  return {
    ...state,
    startAnalysis,
    resetAnalysis,
    isAnalyzing,
    canRetry,
    
    // Additional computed properties
    // stepLabel: STEP_LABELS[state.currentStep], // Removed to fix build
    bookInfo,
    analysisHealth,
  }
}

// Helper hook for getting persisted values
export function usePersistedAnalysisSettings() {
  const lastBookId = typeof window !== 'undefined' ? localStorage.getItem('lastBookId') || '' : ''
  const lastMode = typeof window !== 'undefined' ? (localStorage.getItem('lastMode') as AnalysisMode) || 'auto' : 'auto'
  
  return { lastBookId, lastMode }
}
