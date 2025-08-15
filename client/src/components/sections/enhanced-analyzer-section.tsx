import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { StepProgress } from '@/components/ui/step-chip'
import { 
  Search, 
  BookOpen, 
  Loader2, 
  AlertCircle, 
  Play, 
  RotateCcw,
  Settings,
  Zap,
  Brain
} from 'lucide-react'
import { toast } from 'sonner'
import { useAnalysisContext } from '@/contexts/analysis-context'
import { useWorkerAnalysis } from '@/hooks/use-worker-analysis'
import { AnalysisStepper } from '@/components/ui/analysis-stepper'
import { usePersistedAnalysisSettings, AnalysisMode, AnalysisStep } from '@/hooks/use-analysis-pipeline'
import { BookIdSchema } from '@/lib/api/schemas'

export function EnhancedAnalyzerSection() {
  const [bookId, setBookId] = useState('')
  const [selectedMode, setSelectedMode] = useState<AnalysisMode>('auto')
  
  const { lastBookId, lastMode } = usePersistedAnalysisSettings()
  const {
    currentStep,
    progress,
    error,
    characterResults,
    startAnalysis,
    resetAnalysis,
    isAnalyzing,
    canRetry
  } = useAnalysisContext()

  // Enhanced worker-based analysis
  const workerAnalysis = useWorkerAnalysis()

  // Load persisted values on mount
  useEffect(() => {
    if (lastBookId) setBookId(lastBookId)
    if (lastMode) setSelectedMode(lastMode)
  }, [lastBookId, lastMode])

  const isValidBookId = BookIdSchema.safeParse({ id: bookId }).success

  const handleStartAnalysis = () => {
    if (!isValidBookId) {
      toast.error('Please enter a valid book ID')
      return
    }
    
    // Use worker-based analysis for better performance
    workerAnalysis.startAnalysis(bookId.trim(), {
      forceRecompute: false,
      windowSize: 3,
      minEdgeWeight: 2,
      minMentions: 2
    })
  }

  const handleForceAnalyze = () => {
    if (!isValidBookId) {
      toast.error('Please enter a valid book ID')
      return
    }
    
    workerAnalysis.startAnalysis(bookId.trim(), {
      forceRecompute: true,
      windowSize: 3,
      minEdgeWeight: 2,
      minMentions: 2
    })
  }

  const handleRetry = () => {
    if (bookId && isValidBookId) {
      resetAnalysis()
      setTimeout(() => startAnalysis(bookId, selectedMode), 100)
    }
  }

  // Convert pipeline step to step chip status
  const getStepStatus = (step: string, current: AnalysisStep): 'pending' | 'active' | 'completed' | 'error' => {
    const stepOrder = ['fetch', 'parse', 'characters', 'graph', 'insights']
    const currentIndex = stepOrder.indexOf(current)
    const stepIndex = stepOrder.indexOf(step)
    
    if (current === 'error') {
      return stepIndex <= currentIndex ? 'error' : 'pending'
    }
    
    if (stepIndex < currentIndex || current === 'complete') {
      return 'completed'
    } else if (stepIndex === currentIndex) {
      return 'active'
    } else {
      return 'pending'
    }
  }

  const pipelineSteps = [
    { id: 'fetch', label: 'Fetch', status: getStepStatus('fetch', currentStep) },
    { id: 'parse', label: 'Parse', status: getStepStatus('parse', currentStep) },
    { id: 'characters', label: 'Characters', status: getStepStatus('characters', currentStep) },
    { id: 'graph', label: 'Graph', status: getStepStatus('graph', currentStep) },
    { id: 'insights', label: 'Insights', status: getStepStatus('insights', currentStep) },
  ]

  const popularBooks = [
    { id: '1342', title: 'Pride and Prejudice', author: 'Jane Austen' },
    { id: '84', title: 'Frankenstein', author: 'Mary Shelley' },
    { id: '1661', title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle' },
    { id: '74', title: 'The Adventures of Tom Sawyer', author: 'Mark Twain' },
    { id: '11', title: 'Alice\'s Adventures in Wonderland', author: 'Lewis Carroll' },
    { id: '2701', title: 'Moby Dick', author: 'Herman Melville' }
  ]

  return (
    <div className="space-y-12">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <h2 id="analyzer-heading" className="text-3xl sm:text-4xl font-bold text-foreground">
          Character Analysis Pipeline
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Advanced AI-powered character extraction and relationship analysis for Project Gutenberg books.
        </p>
      </motion.div>

      {/* Main Analysis Interface */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Input Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Analysis Configuration
            </CardTitle>
            <CardDescription>
              Configure your book analysis settings and processing mode
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Book ID Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Book ID</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Enter book ID • Try: 84 (Frankenstein), 1342 (Pride & Prejudice), 2701 (Moby Dick)"
                    value={bookId}
                    onChange={(e) => setBookId(e.target.value)}
                    disabled={isAnalyzing}
                    className={`${!isValidBookId && bookId ? 'border-destructive' : ''}`}
                  />
                  {isAnalyzing && currentStep === 'fetch' && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleStartAnalysis}
                  disabled={!isValidBookId || isAnalyzing || workerAnalysis.isAnalyzing}
                  className="min-w-[140px]"
                >
                  {(isAnalyzing || workerAnalysis.isAnalyzing) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Fetch & Analyze
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleForceAnalyze}
                  disabled={!isValidBookId || isAnalyzing || workerAnalysis.isAnalyzing}
                  className="min-w-[120px]"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Force Re-compute
                </Button>
              </div>
            </div>

            {/* Mode Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Analysis Mode
              </label>
              <div className="flex gap-3">
                <Button
                  variant={selectedMode === 'auto' ? 'default' : 'outline'}
                  onClick={() => setSelectedMode('auto')}
                  disabled={isAnalyzing}
                  className="flex-1"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Auto (LLM + Fallback)
                </Button>
                <Button
                  variant={selectedMode === 'ollama' ? 'default' : 'outline'}
                  onClick={() => setSelectedMode('ollama')}
                  disabled={isAnalyzing}
                  className="flex-1"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Ollama LLM Only

                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Auto mode tries LLM first, falls back to NLP. Ollama mode requires local Ollama server.
              </p>
            </div>

            {/* Service Status */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>NLP Fallback: Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Ollama LLM: Check Server</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Progress Stepper */}
        {(workerAnalysis.isAnalyzing || workerAnalysis.currentStep === 'complete' || workerAnalysis.currentStep === 'error') && (
          <AnalysisStepper
            currentStep={workerAnalysis.currentStep}
            progress={workerAnalysis.progress}
            message={workerAnalysis.message}
            streamProgress={workerAnalysis.streamProgress}
            analysisProgress={workerAnalysis.analysisProgress}
            onCancel={workerAnalysis.canCancel ? workerAnalysis.cancelAnalysis : undefined}
            canCancel={workerAnalysis.canCancel}
            fromCache={workerAnalysis.fromCache}
          />
        )}

        {/* Legacy Progress Pipeline */}
        {(isAnalyzing || currentStep === 'complete' || currentStep === 'error') && !workerAnalysis.isAnalyzing && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Analysis Progress
                    {currentStep === 'complete' && <Badge variant="default">Complete</Badge>}
                    {currentStep === 'error' && <Badge variant="destructive">Error</Badge>}
                  </CardTitle>
                  <CardDescription>
                    Book ID: {bookId}
                  </CardDescription>
                </div>
                {canRetry && (
                  <Button variant="outline" size="sm" onClick={handleRetry}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Step Chips */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Pipeline Steps</p>
                <StepProgress steps={pipelineSteps} />
              </div>

              {/* Current Status */}
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Status:</span>
                <span className={currentStep === 'error' ? 'text-destructive' : 'text-foreground'}>
                  {currentStep}
                </span>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-destructive">Analysis Failed</p>
                    <p className="text-sm text-destructive/80">{error}</p>
                  </div>
                </div>
              )}

              {/* Results Summary */}
              {characterResults && currentStep === 'complete' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Analysis Complete
                    </span>
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <p>Found {characterResults.total_characters} characters using {characterResults.method}</p>
                    <p>Processing time: {characterResults.processing_time_ms}ms</p>
                    <p>Results are now available in the Graph and Insights sections below.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Popular Books Quick Start */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="space-y-6"
      >
        <Separator />
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-foreground mb-2">
            Quick Start
          </h3>
          <p className="text-muted-foreground">
            Try these popular classics to see the analysis in action
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {popularBooks.map((book) => (
            <Card 
              key={book.id} 
              className={`cursor-pointer hover:shadow-md transition-all ${
                bookId === book.id ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => !isAnalyzing && setBookId(book.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <h4 className="font-medium text-sm line-clamp-2">{book.title}</h4>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <BookOpen className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      #{book.id}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
