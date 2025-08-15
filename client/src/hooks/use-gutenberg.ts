import { useQuery } from '@tanstack/react-query'
import { gutenbergApi, GutenbergApiError } from '@/lib/api/gutenberg'
import { BookResolve, BookText, BookPreview } from '@/lib/api/schemas'

export interface UseGutenbergOptions {
  enabled?: boolean
  fetchText?: boolean
  fetchPreview?: boolean
}

export interface UseGutenbergResult {
  // Data
  resolve: BookResolve | undefined
  text: BookText | undefined
  preview: BookPreview | undefined
  
  // Loading states
  isLoadingResolve: boolean
  isLoadingText: boolean
  isLoadingPreview: boolean
  isLoading: boolean
  
  // Error states
  resolveError: GutenbergApiError | null
  textError: GutenbergApiError | null
  previewError: GutenbergApiError | null
  error: GutenbergApiError | null
  
  // Success states
  isSuccess: boolean
  hasResolved: boolean
  hasText: boolean
  hasPreview: boolean
  
  // Actions
  refetch: () => void
}

/**
 * Hook for fetching Gutenberg book data with progressive loading
 */
export function useGutenberg(
  id: string | null, 
  options: UseGutenbergOptions = {}
): UseGutenbergResult {
  const { 
    enabled = true, 
    fetchText = false, 
    fetchPreview = true 
  } = options

  const shouldFetch = enabled && !!id && id.trim() !== ''

  // Step 1: Resolve book metadata and URL
  const {
    data: resolve,
    isLoading: isLoadingResolve,
    error: resolveError,
    refetch: refetchResolve,
  } = useQuery({
    queryKey: ['gutenberg', 'resolve', id],
    queryFn: () => gutenbergApi.resolveBook(id!),
    enabled: shouldFetch,
    retry: (failureCount, error) => {
      // Don't retry on 404s or validation errors
      if (error instanceof GutenbergApiError && 
          (error.status === 404 || error.code === 'VALIDATION_ERROR')) {
        return false
      }
      return failureCount < 2
    },
  })

  // Step 2: Fetch preview text (if resolved and requested)
  const {
    data: preview,
    isLoading: isLoadingPreview,
    error: previewError,
    refetch: refetchPreview,
  } = useQuery({
    queryKey: ['gutenberg', 'preview', id],
    queryFn: () => gutenbergApi.fetchPreview(id!),
    enabled: shouldFetch && fetchPreview && !!resolve,
    retry: 1,
  })

  // Step 3: Fetch full text (if resolved and requested)
  const {
    data: text,
    isLoading: isLoadingText,
    error: textError,
    refetch: refetchText,
  } = useQuery({
    queryKey: ['gutenberg', 'text', id],
    queryFn: () => gutenbergApi.fetchText(id!),
    enabled: shouldFetch && fetchText && !!resolve,
    retry: 1,
    staleTime: 10 * 60 * 1000, // Cache full text longer (10 minutes)
  })

  // Compute derived states
  const isLoading = isLoadingResolve || 
    (fetchPreview && isLoadingPreview) || 
    (fetchText && isLoadingText)

  const error = resolveError || 
    (fetchPreview ? previewError : null) || 
    (fetchText ? textError : null)

  const hasResolved = !!resolve
  const hasPreview = !!preview
  const hasText = !!text
  const isSuccess = hasResolved && 
    (!fetchPreview || hasPreview) && 
    (!fetchText || hasText)

  const refetch = () => {
    refetchResolve()
    if (fetchPreview) refetchPreview()
    if (fetchText) refetchText()
  }

  return {
    // Data
    resolve,
    text,
    preview,
    
    // Loading states
    isLoadingResolve,
    isLoadingText,
    isLoadingPreview,
    isLoading,
    
    // Error states
    resolveError: resolveError as GutenbergApiError | null,
    textError: textError as GutenbergApiError | null,
    previewError: previewError as GutenbergApiError | null,
    error: error as GutenbergApiError | null,
    
    // Success states
    isSuccess,
    hasResolved,
    hasText,
    hasPreview,
    
    // Actions
    refetch,
  }
}

/**
 * Simplified hook for just getting book previews
 */
export function useGutenbergPreview(id: string | null, enabled = true) {
  return useGutenberg(id, { 
    enabled, 
    fetchPreview: true, 
    fetchText: false 
  })
}

/**
 * Hook for getting full book text
 */
export function useGutenbergText(id: string | null, enabled = true) {
  return useGutenberg(id, { 
    enabled, 
    fetchPreview: false, 
    fetchText: true 
  })
}
