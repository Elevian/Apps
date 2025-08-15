import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { StateManager, type ShareableState } from '@/lib/sharing/state-manager'
import { toast } from 'sonner'

export interface SharedStateHook {
  sharedState: ShareableState | null
  isLoading: boolean
  isRestoring: boolean
  error: string | null
  restoreFromURL: () => void
  clearSharedState: () => void
  hasSharedState: boolean
}

/**
 * Hook for managing shared state from URLs
 */
export function useSharedState(): SharedStateHook {
  const { t } = useTranslation()
  const [sharedState, setSharedState] = useState<ShareableState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Restore state from URL on component mount
   */
  useEffect(() => {
    const restoreFromURL = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const state = StateManager.getStateFromURL()
        
        if (state) {
          // Validate the shared state
          if (validateSharedState(state)) {
            setSharedState(state)
            toast.success('Analysis state restored from URL!')
          } else {
            setError('Invalid shared state format')
            toast.error('Invalid shared analysis state')
          }
        }
      } catch (error) {
        console.error('Failed to restore state from URL:', error)
        setError('Failed to parse shared state')
        toast.error('Failed to restore analysis from URL')
      } finally {
        setIsLoading(false)
      }
    }

    // Only restore on initial load
    if (window.location.hash.includes('#share=')) {
      restoreFromURL()
    }
  }, [])

  /**
   * Listen for URL changes (back/forward navigation)
   */
  useEffect(() => {
    const handleHashChange = () => {
      const state = StateManager.getStateFromURL()
      setSharedState(state)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  /**
   * Manually restore state from current URL
   */
  const restoreFromURL = useCallback(async () => {
    setIsRestoring(true)
    setError(null)

    try {
      const state = StateManager.getStateFromURL()
      
      if (state) {
        if (validateSharedState(state)) {
          setSharedState(state)
          toast.success('Analysis state restored!')
        } else {
          setError('Invalid shared state format')
          toast.error('Invalid analysis state')
        }
      } else {
        setError('No shared state found in URL')
        toast.error('No analysis state found in URL')
      }
    } catch (error) {
      console.error('Failed to restore state:', error)
      setError('Failed to parse shared state')
      toast.error('Failed to restore analysis state')
    } finally {
      setIsRestoring(false)
    }
  }, [])

  /**
   * Clear shared state
   */
  const clearSharedState = useCallback(() => {
    setSharedState(null)
    setError(null)
    
    // Remove share hash from URL
    if (window.location.hash.includes('#share=')) {
      window.history.replaceState(null, '', window.location.pathname)
    }
    
    toast.info('Shared analysis state cleared')
  }, [])

  return {
    sharedState,
    isLoading,
    isRestoring,
    error,
    restoreFromURL,
    clearSharedState,
    hasSharedState: sharedState !== null
  }
}

/**
 * Validate shared state structure
 */
function validateSharedState(state: ShareableState): boolean {
  if (!state || typeof state !== 'object') return false

  // Check required fields
  const requiredFields = ['bookId', 'bookTitle', 'characters', 'graphData']
  const hasRequiredFields = requiredFields.every(field => 
    state.hasOwnProperty(field) && state[field as keyof ShareableState] !== undefined
  )

  if (!hasRequiredFields) return false

  // Validate characters array
  if (!Array.isArray(state.characters)) return false

  // Validate graph data structure
  if (!state.graphData || typeof state.graphData !== 'object') return false
  if (!Array.isArray(state.graphData.nodes) || !Array.isArray(state.graphData.edges)) return false

  // Check version compatibility
  if (state.version && !isVersionCompatible(state.version)) return false

  return true
}

/**
 * Check if shared state version is compatible
 */
function isVersionCompatible(version: string): boolean {
  const currentMajor = 2 // Current major version
  const sharedMajor = parseInt(version.split('.')[0])
  
  // Allow same major version or newer minor versions
  return sharedMajor >= currentMajor - 1 && sharedMajor <= currentMajor
}

/**
 * Hook for applying shared state to analysis context
 */
export function useSharedStateApplication() {
  const { t } = useTranslation()

  const applySharedState = useCallback(async (
    sharedState: ShareableState,
    onApply?: (state: ShareableState) => void
  ): Promise<boolean> => {
    try {
      // Validate state before applying
      if (!validateSharedState(sharedState)) {
        toast.error('Invalid shared state structure')
        return false
      }

      // Convert compressed state back to full format
      const fullState = StateManager.restoreState(sharedState)

      // Apply to analysis context
      onApply?.(fullState)

      // Update UI state if needed
      if (sharedState.selectedCharacter) {
        // This would need to be handled by the parent component
        console.log('Should select character:', sharedState.selectedCharacter)
      }

      if (sharedState.graphSettings) {
        // Apply graph settings
        console.log('Should apply graph settings:', sharedState.graphSettings)
      }

      toast.success('Shared analysis applied successfully!')
      return true

    } catch (error) {
      console.error('Failed to apply shared state:', error)
      toast.error('Failed to apply shared analysis')
      return false
    }
  }, [])

  return { applySharedState }
}

/**
 * Hook for sharing current state
 */
export function useStateSharing() {
  const { t } = useTranslation()

  const generateShareURL = useCallback(async (
    analysisData: any,
    uiState: any = {},
    options: any = {}
  ): Promise<string | null> => {
    try {
      const state = StateManager.createShareableState(analysisData, uiState, options)
      const url = StateManager.generateShareURL(state, options)
      
      return url
    } catch (error) {
      console.error('Failed to generate share URL:', error)
      toast.error('Failed to generate share URL')
      return null
    }
  }, [])

  const copyShareURL = useCallback(async (
    analysisData: any,
    uiState: any = {},
    options: any = {}
  ): Promise<boolean> => {
    try {
      const state = StateManager.createShareableState(analysisData, uiState, options)
      const success = await StateManager.copyShareURL(state, options)
      
      if (success) {
        toast.success('Share URL copied to clipboard!')
      } else {
        toast.error('Failed to copy URL to clipboard')
      }
      
      return success
    } catch (error) {
      console.error('Failed to copy share URL:', error)
      toast.error('Failed to copy share URL')
      return false
    }
  }, [])

  const updateCurrentURL = useCallback((
    analysisData: any,
    uiState: any = {},
    options: any = {}
  ) => {
    try {
      const state = StateManager.createShareableState(analysisData, uiState, options)
      StateManager.updateURL(state, options)
      toast.success('URL updated with current analysis!')
    } catch (error) {
      console.error('Failed to update URL:', error)
      toast.error('Failed to update URL')
    }
  }, [])

  return {
    generateShareURL,
    copyShareURL,
    updateCurrentURL
  }
}

/**
 * Hook for URL state monitoring
 */
export function useURLStateMonitor() {
  const [hasShareInURL, setHasShareInURL] = useState(false)
  const [shareHash, setShareHash] = useState<string | null>(null)

  useEffect(() => {
    const checkURL = () => {
      const hash = window.location.hash
      const hasShare = hash.includes('#share=')
      setHasShareInURL(hasShare)
      
      if (hasShare) {
        const match = hash.match(/#share=([^&]+)/)
        setShareHash(match ? match[1] : null)
      } else {
        setShareHash(null)
      }
    }

    checkURL()

    window.addEventListener('hashchange', checkURL)
    return () => window.removeEventListener('hashchange', checkURL)
  }, [])

  return {
    hasShareInURL,
    shareHash,
    isValidShare: shareHash !== null && shareHash.length > 0
  }
}
