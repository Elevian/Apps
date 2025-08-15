import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Share2, 
  Download, 
  X, 
  ExternalLink,
  Clock,
  User,
  BookOpen,
  CheckCircle2
} from 'lucide-react'
import { useSharedState, useSharedStateApplication } from '@/hooks/use-shared-state'
import { type ShareableState } from '@/lib/sharing/state-manager'

export interface SharedStateBannerProps {
  onApplyState?: (state: ShareableState) => void
  onDismiss?: () => void
  className?: string
}

export function SharedStateBanner({
  onApplyState,
  onDismiss,
  className = ''
}: SharedStateBannerProps) {
  const { t } = useTranslation()
  const { sharedState, isLoading, clearSharedState, hasSharedState } = useSharedState()
  const { applySharedState } = useSharedStateApplication()

  const handleApplyState = async () => {
    if (!sharedState) return

    const success = await applySharedState(sharedState, onApplyState)
    if (success) {
      onDismiss?.()
    }
  }

  const handleDismiss = () => {
    clearSharedState()
    onDismiss?.()
  }

  if (!hasSharedState || !sharedState) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-4 left-4 right-4 z-50 ${className}`}
      >
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Share2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="flex items-center justify-between">
            <div className="space-y-2">
              {/* Main message */}
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  Shared Analysis Detected
                </span>
                <Badge variant="secondary" className="text-xs">
                  {sharedState.version}
                </Badge>
              </div>

              {/* Book information */}
              <div className="flex items-center gap-4 text-sm text-blue-800 dark:text-blue-200">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  <span>{sharedState.bookTitle || 'Unknown Book'}</span>
                </div>
                {sharedState.bookAuthor && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{sharedState.bookAuthor}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(sharedState.analysisDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Analysis summary */}
              <div className="flex items-center gap-4 text-xs text-blue-700 dark:text-blue-300">
                <span>{sharedState.characters.length} characters</span>
                <span>{sharedState.graphData.edges.length} connections</span>
                {sharedState.quotes && (
                  <span>{sharedState.quotes.length} quotes</span>
                )}
                {sharedState.chapterTopics && (
                  <span>{sharedState.chapterTopics.length} chapters</span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                size="sm"
                onClick={handleApplyState}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Load Analysis
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Compact version for mobile or constrained spaces
 */
export function CompactSharedStateBanner({
  onApplyState,
  onDismiss,
  className = ''
}: SharedStateBannerProps) {
  const { sharedState, hasSharedState } = useSharedState()
  const { applySharedState } = useSharedStateApplication()

  const handleApplyState = async () => {
    if (!sharedState) return
    await applySharedState(sharedState, onApplyState)
    onDismiss?.()
  }

  if (!hasSharedState || !sharedState) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Shared: {sharedState.bookTitle}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {sharedState.characters.length} characters • {sharedState.graphData.edges.length} connections
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={handleApplyState}>
            Load
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Hook to manage shared state banner visibility
 */
export function useSharedStateBanner() {
  const [showBanner, setShowBanner] = React.useState(true)
  const { hasSharedState } = useSharedState()

  const dismissBanner = React.useCallback(() => {
    setShowBanner(false)
  }, [])

  const resetBanner = React.useCallback(() => {
    setShowBanner(true)
  }, [])

  return {
    shouldShowBanner: hasSharedState && showBanner,
    dismissBanner,
    resetBanner
  }
}
