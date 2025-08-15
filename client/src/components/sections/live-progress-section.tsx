import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Activity, 
  Clock, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Play,
  Pause,
  Square,
  BarChart3,
  Network,
  Brain,
  FileText,
  Database,
  Share2
} from 'lucide-react'
import { useAnalysisResults } from '@/contexts/analysis-context'
import { useWorkerAnalysis } from '@/hooks/use-worker-analysis'
import { AnalysisStepper } from '@/components/ui/analysis-stepper'

export function LiveProgressSection() {
  const { t } = useTranslation()
  const {
    isAnalyzing,
    currentStep,
    characters,
    bookTitle,
    bookAuthor,
    hasResults
  } = useAnalysisResults()
  
  // Calculate progress based on current step
  const progress = (() => {
    const stepProgress = {
      'idle': 0,
      'fetch': 20,
      'parse': 40,
      'characters': 60,
      'graph': 80,
      'insights': 90,
      'complete': 100,
      'error': 0
    }
    return stepProgress[currentStep as keyof typeof stepProgress] || 0
  })()

  const workerAnalysis = useWorkerAnalysis()

  // Determine which analysis system is active
  const activeAnalysis = workerAnalysis.isAnalyzing ? 'worker' : (isAnalyzing ? 'legacy' : null)
  const showProgress = activeAnalysis !== null

  if (!showProgress && !hasResults) {
    return null
  }

  return (
    <section id="live-progress" className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h2 id="live-progress-heading" className="text-3xl font-bold text-foreground mb-4">
              {showProgress ? 'Analysis in Progress' : 'Analysis Complete'}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {showProgress 
                ? 'Real-time analysis progress with detailed step tracking and performance metrics'
                : 'Your analysis is ready! Explore the results below.'
              }
            </p>
          </div>

          {/* Live Progress Cards */}
          <AnimatePresence mode="wait">
            {showProgress ? (
              <ActiveProgressView 
                key="active"
                activeAnalysis={activeAnalysis}
                workerAnalysis={workerAnalysis}
                isAnalyzing={isAnalyzing}
                currentStep={currentStep}
                progress={progress}
                bookTitle={bookTitle}
                bookAuthor={bookAuthor}
              />
            ) : hasResults ? (
              <CompletedAnalysisView 
                key="completed"
                characters={characters}
                bookTitle={bookTitle}
                bookAuthor={bookAuthor}
              />
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}

/**
 * Active progress view with real-time updates
 */
function ActiveProgressView({
  activeAnalysis,
  workerAnalysis,
  isAnalyzing,
  currentStep,
  progress,
  bookTitle,
  bookAuthor
}: {
  activeAnalysis: 'worker' | 'legacy'
  workerAnalysis: any
  isAnalyzing: boolean
  currentStep: string
  progress: number
  bookTitle: string | null
  bookAuthor: string | null
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6"
    >
      
      {/* Book Information Header */}
      {(bookTitle || bookAuthor) && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Analyzing Book
            </CardTitle>
            <div className="flex items-center gap-4">
              {bookTitle && (
                <div>
                  <p className="font-medium">{bookTitle}</p>
                  {bookAuthor && (
                    <p className="text-sm text-muted-foreground">by {bookAuthor}</p>
                  )}
                </div>
              )}
              <Badge variant="secondary" className="animate-pulse">
                <Activity className="h-3 w-3 mr-1" />
                Processing
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Progress Display */}
      {activeAnalysis === 'worker' ? (
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
      ) : (
        <LegacyProgressView 
          currentStep={currentStep}
          progress={progress}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* Performance Metrics */}
      <PerformanceMetrics activeAnalysis={activeAnalysis} />

    </motion.div>
  )
}

/**
 * Legacy progress view for backward compatibility
 */
function LegacyProgressView({
  currentStep,
  progress,
  isAnalyzing
}: {
  currentStep: string
  progress: number
  isAnalyzing: boolean
}) {
  const stepIcons = {
    'downloading': FileText,
    'parsing': Database,
    'analyzing': Brain,
    'generating': BarChart3,
    'complete': CheckCircle2,
    'error': AlertCircle
  }

  const StepIcon = stepIcons[currentStep as keyof typeof stepIcons] || Activity

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StepIcon className="h-5 w-5" />
          Analysis Progress
        </CardTitle>
        <CardDescription>
          Processing text and generating character insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium capitalize">
              {currentStep.replace('-', ' ')}
            </span>
            <span className="text-sm text-muted-foreground">
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="w-full" />
          {isAnalyzing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analysis in progress...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Completed analysis overview
 */
function CompletedAnalysisView({
  characters,
  bookTitle,
  bookAuthor
}: {
  characters: any[]
  bookTitle: string | null
  bookAuthor: string | null
}) {
  const characterCount = characters?.length || 0
  const topCharacters = characters?.slice(0, 3) || []

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      
      {/* Completion Status */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Analysis Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bookTitle && (
              <div>
                <p className="font-medium text-sm">{bookTitle}</p>
                {bookAuthor && (
                  <p className="text-xs text-muted-foreground">by {bookAuthor}</p>
                )}
              </div>
            )}
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Character Summary */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Characters Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-2xl font-bold">{characterCount}</div>
            {topCharacters.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Top Characters:</p>
                {topCharacters.map((char, index) => (
                  <div key={char.name} className="flex items-center justify-between text-sm">
                    <span>{char.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {char.mentions}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => document.getElementById('graph')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Network className="h-4 w-4 mr-2" />
              View Network
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => document.getElementById('insights')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Insights
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => document.getElementById('discovery')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Export & Share
            </Button>
          </div>
        </CardContent>
      </Card>

    </motion.div>
  )
}

/**
 * Performance metrics display
 */
function PerformanceMetrics({ activeAnalysis }: { activeAnalysis: 'worker' | 'legacy' }) {
  const [metrics, setMetrics] = React.useState({
    memoryUsage: 0,
    processingTime: 0,
    networkCalls: 0
  })

  React.useEffect(() => {
    const updateMetrics = () => {
      // Simulate performance metrics
      setMetrics({
        memoryUsage: Math.round((performance as any).memory?.usedJSHeapSize / 1024 / 1024) || 0,
        processingTime: Date.now() % 60000, // Mock processing time
        networkCalls: 2 // Typical for book download + metadata
      })
    }

    const interval = setInterval(updateMetrics, 1000)
    updateMetrics()

    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Metrics
          <Badge variant="secondary" className="text-xs">
            {activeAnalysis === 'worker' ? 'Web Worker' : 'Main Thread'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold">{metrics.memoryUsage}MB</div>
            <div className="text-xs text-muted-foreground">Memory Usage</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{Math.round(metrics.processingTime / 1000)}s</div>
            <div className="text-xs text-muted-foreground">Processing Time</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{metrics.networkCalls}</div>
            <div className="text-xs text-muted-foreground">Network Calls</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
