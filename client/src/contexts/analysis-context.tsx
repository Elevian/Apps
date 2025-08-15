import { createContext, useContext, ReactNode } from 'react'
import { useAnalysisPipeline, AnalysisPipelineState, AnalysisPipelineControls } from '@/hooks/use-analysis-pipeline'
import { Character, CharacterAnalysisResult } from '@/lib/api/schemas'

export interface AnalysisContextValue extends AnalysisPipelineState, AnalysisPipelineControls {
  // Computed properties for easy access
  hasResults: boolean
  characters: Character[]
  bookTitle: string | null
  bookAuthor: string | null
  analysisMethod: string | null
  bookText: string | null
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null)

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const pipeline = useAnalysisPipeline()
  
  const contextValue: AnalysisContextValue = {
    ...pipeline,
    
    // Computed properties
    hasResults: pipeline.characterResults !== null && pipeline.currentStep === 'complete',
    characters: pipeline.characterResults?.characters || [],
    bookTitle: (pipeline as any).bookInfo?.title || null,
    bookAuthor: (pipeline as any).bookInfo?.author || null,
    analysisMethod: pipeline.characterResults?.method || null,
    bookText: (pipeline as any).text?.text || null,
  }

  return (
    <AnalysisContext.Provider value={contextValue}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysisContext() {
  const context = useContext(AnalysisContext)
  if (!context) {
    throw new Error('useAnalysisContext must be used within an AnalysisProvider')
  }
  return context
}

// Hook for sections that want to display analysis results
export function useAnalysisResults() {
  const context = useAnalysisContext()
  
  return {
    hasResults: context.hasResults,
    characters: context.characters,
    bookTitle: context.bookTitle,
    bookAuthor: context.bookAuthor,
    analysisMethod: context.analysisMethod,
    characterResults: context.characterResults,
    isAnalyzing: context.isAnalyzing,
    currentStep: context.currentStep,
    bookText: context.bookText,
  }
}
