import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Download, 
  FileText, 
  Network, 
  Heart, 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Clock,
  X,
  Loader2,
  Pause
} from 'lucide-react'
import type { WorkerStep } from '@/hooks/use-worker-analysis'
import type { StreamProgress } from '@/lib/streaming/stream-fetcher'
import type { AnalysisProgress } from '@/workers/analysis.worker'

export interface StepperProps {
  currentStep: WorkerStep
  progress: number
  message: string
  streamProgress?: StreamProgress
  analysisProgress?: AnalysisProgress
  onCancel?: () => void
  canCancel?: boolean
  fromCache?: boolean
  className?: string
}

const STEP_CONFIG = {
  idle: { icon: Clock, label: 'Ready', color: 'text-muted-foreground' },
  resolving: { icon: FileText, label: 'Resolving Book', color: 'text-blue-500' },
  downloading: { icon: Download, label: 'Downloading', color: 'text-blue-500' },
  splitting: { icon: FileText, label: 'Splitting Text', color: 'text-purple-500' },
  parsing: { icon: FileText, label: 'Parsing', color: 'text-purple-500' },
  cooccurrence: { icon: Network, label: 'Building Graph', color: 'text-green-500' },
  sentiment: { icon: Heart, label: 'Analyzing Sentiment', color: 'text-pink-500' },
  ranking: { icon: Trophy, label: 'Ranking Characters', color: 'text-yellow-500' },
  complete: { icon: CheckCircle, label: 'Complete', color: 'text-green-600' },
  error: { icon: XCircle, label: 'Error', color: 'text-red-500' },
  cancelled: { icon: Pause, label: 'Cancelled', color: 'text-orange-500' }
}

const STEP_ORDER: WorkerStep[] = [
  'resolving', 'downloading', 'splitting', 'cooccurrence', 'sentiment', 'ranking', 'complete'
]

export function AnalysisStepper({
  currentStep,
  progress,
  message,
  streamProgress,
  analysisProgress,
  onCancel,
  canCancel = false,
  fromCache = false,
  className
}: StepperProps) {
  const currentStepIndex = STEP_ORDER.indexOf(currentStep)
  const config = STEP_CONFIG[currentStep]
  const Icon = config.icon

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className={`h-5 w-5 ${config.color}`} />
            {config.label}
            {fromCache && (
              <Badge variant="secondary" className="text-xs">
                Cached
              </Badge>
            )}
          </CardTitle>
          
          {canCancel && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{message}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          
          <Progress 
            value={progress} 
            className="h-2"
          />
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center justify-between">
          {STEP_ORDER.map((step, index) => {
            const stepConfig = STEP_CONFIG[step]
            const StepIcon = stepConfig.icon
            const isActive = index === currentStepIndex
            const isComplete = index < currentStepIndex || currentStep === 'complete'
            const isCurrent = step === currentStep

            return (
              <div key={step} className="flex flex-col items-center gap-1">
                <motion.div
                  className={`
                    relative w-8 h-8 rounded-full border-2 flex items-center justify-center
                    ${isComplete ? 'bg-green-100 border-green-500' : ''}
                    ${isCurrent ? 'bg-blue-100 border-blue-500' : ''}
                    ${!isComplete && !isCurrent ? 'bg-gray-100 border-gray-300' : ''}
                  `}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    rotate: isCurrent ? [0, 360] : 0
                  }}
                  transition={{
                    scale: { duration: 0.2 },
                    rotate: { duration: 2, repeat: isCurrent ? Infinity : 0, ease: 'linear' }
                  }}
                >
                  {isComplete ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  ) : (
                    <StepIcon className="h-4 w-4 text-gray-400" />
                  )}
                </motion.div>
                
                <span className={`
                  text-xs font-medium
                  ${isComplete ? 'text-green-600' : ''}
                  ${isCurrent ? 'text-blue-600' : ''}
                  ${!isComplete && !isCurrent ? 'text-gray-400' : ''}
                `}>
                  {stepConfig.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Detailed Progress Info */}
        <AnimatePresence mode="wait">
          {streamProgress && currentStep === 'downloading' && (
            <motion.div
              key="stream-progress"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-blue-900">Download Progress</span>
                <span className="text-blue-700">
                  {(streamProgress.bytesLoaded / 1024 / 1024).toFixed(1)} MB
                  {streamProgress.bytesTotal && (
                    <span> / {(streamProgress.bytesTotal / 1024 / 1024).toFixed(1)} MB</span>
                  )}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-blue-700">
                <div>
                  <span className="font-medium">Speed:</span> {(streamProgress.speed / 1024).toFixed(0)} KB/s
                </div>
                <div>
                  <span className="font-medium">ETA:</span> {
                    streamProgress.timeRemaining 
                      ? `${Math.round(streamProgress.timeRemaining)}s`
                      : 'Calculating...'
                  }
                </div>
              </div>
            </motion.div>
          )}

          {analysisProgress && currentStep !== 'downloading' && (
            <motion.div
              key="analysis-progress"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-purple-50 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-purple-900">Analysis Progress</span>
                <span className="text-purple-700">{analysisProgress.step}</span>
              </div>
              
              <div className="text-xs text-purple-700">
                {analysisProgress.message}
              </div>
              
              {analysisProgress.data && (
                <div className="text-xs text-purple-600 font-mono bg-purple-100 rounded p-2">
                  {JSON.stringify(analysisProgress.data, null, 2)}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {currentStep === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">Analysis Failed</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{message}</p>
          </motion.div>
        )}

        {/* Success State */}
        {currentStep === 'complete' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Analysis Complete!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">{message}</p>
          </motion.div>
        )}

        {/* Cancelled State */}
        {currentStep === 'cancelled' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-orange-50 border border-orange-200 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 text-orange-800">
              <Pause className="h-4 w-4" />
              <span className="font-medium">Analysis Cancelled</span>
            </div>
            <p className="text-sm text-orange-700 mt-1">The analysis was stopped by user request.</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version for smaller spaces
export function CompactAnalysisStepper({
  currentStep,
  progress,
  message,
  onCancel,
  canCancel = false,
  className
}: Pick<StepperProps, 'currentStep' | 'progress' | 'message' | 'onCancel' | 'canCancel' | 'className'>) {
  const config = STEP_CONFIG[currentStep]
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-3 p-3 bg-muted/30 rounded-lg ${className}`}>
      <Icon className={`h-4 w-4 ${config.color}`} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium truncate">{config.label}</span>
          <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1" />
        <p className="text-xs text-muted-foreground mt-1 truncate">{message}</p>
      </div>
      
      {canCancel && onCancel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0 flex-shrink-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
