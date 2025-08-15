/**
 * Privacy-aware wrapper for Gutenberg API
 * Respects local-only mode and privacy settings
 */

import { gutenbergAPI, NetworkError } from '@/lib/security/secure-network'
import { privacyManager } from '@/lib/security/privacy-manager'
import { toast } from 'sonner'

export interface BookMetadata {
  id: number
  title: string
  authors: Array<{ name: string }>
  subjects: string[]
  languages: string[]
  download_count: number
  formats: Record<string, string>
}

export interface BookSearchResult {
  count: number
  results: BookMetadata[]
}

/**
 * Secure Gutenberg API client
 */
export class SecureGutenbergAPI {
  private static instance: SecureGutenbergAPI

  static getInstance(): SecureGutenbergAPI {
    if (!SecureGutenbergAPI.instance) {
      SecureGutenbergAPI.instance = new SecureGutenbergAPI()
    }
    return SecureGutenbergAPI.instance
  }

  /**
   * Check if API calls are allowed
   */
  private checkPermission(): boolean {
    const settings = privacyManager.getSettings()
    return settings.allowGutenbergAPI
  }

  /**
   * Show appropriate error for blocked requests
   */
  private handleBlockedRequest(): never {
    const settings = privacyManager.getSettings()
    
    if (settings.localOnlyMode) {
      toast.error('Local-only mode is enabled. External API calls are disabled.')
      throw new NetworkError(
        'Local-only mode is enabled. External API calls are disabled.',
        'PRIVACY_BLOCKED'
      )
    } else {
      toast.error('Project Gutenberg API is disabled in privacy settings.')
      throw new NetworkError(
        'Project Gutenberg API is disabled in privacy settings.',
        'PRIVACY_BLOCKED'
      )
    }
  }

  /**
   * Get book metadata
   */
  async getBookInfo(bookId: string): Promise<BookMetadata> {
    if (!this.checkPermission()) {
      this.handleBlockedRequest()
    }

    try {
      const data = await gutenbergAPI.getBookInfo(bookId)
      
      // Normalize the response
      return {
        id: data.id,
        title: data.title || 'Unknown Title',
        authors: data.authors || [],
        subjects: data.subjects || [],
        languages: data.languages || ['en'],
        download_count: data.download_count || 0,
        formats: data.formats || {}
      }
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error
      }
      
      throw new NetworkError(
        `Failed to fetch book metadata for ID ${bookId}`,
        'GUTENBERG_ERROR'
      )
    }
  }

  /**
   * Download book text
   */
  async downloadBookText(bookId: string): Promise<string> {
    if (!this.checkPermission()) {
      this.handleBlockedRequest()
    }

    try {
      const text = await gutenbergAPI.downloadBookText(bookId)
      
      // Basic validation
      if (!text || text.length < 1000) {
        throw new Error('Downloaded text appears to be incomplete')
      }
      
      return text
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error
      }
      
      throw new NetworkError(
        `Failed to download text for book ID ${bookId}. The book may not be available in text format.`,
        'GUTENBERG_ERROR'
      )
    }
  }

  /**
   * Search books (if needed)
   */
  async searchBooks(query: string, limit: number = 20): Promise<BookSearchResult> {
    if (!this.checkPermission()) {
      this.handleBlockedRequest()
    }

    try {
      const data = await gutenbergAPI.searchBooks(query, limit)
      
      return {
        count: data.count || 0,
        results: data.results || []
      }
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error
      }
      
      throw new NetworkError(
        `Failed to search for books with query: ${query}`,
        'GUTENBERG_ERROR'
      )
    }
  }

  /**
   * Get popular books (cached list for offline mode)
   */
  getPopularBooks(): Array<{ id: string; title: string; author: string }> {
    // Return a curated list of popular public domain books
    return [
      { id: '1342', title: 'Pride and Prejudice', author: 'Jane Austen' },
      { id: '11', title: 'Alice\'s Adventures in Wonderland', author: 'Lewis Carroll' },
      { id: '84', title: 'Frankenstein', author: 'Mary Wollstonecraft Shelley' },
      { id: '174', title: 'The Picture of Dorian Gray', author: 'Oscar Wilde' },
      { id: '145', title: 'Middlemarch', author: 'George Eliot' },
      { id: '76', title: 'Adventures of Huckleberry Finn', author: 'Mark Twain' },
      { id: '1661', title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle' },
      { id: '2701', title: 'Moby Dick', author: 'Herman Melville' },
      { id: '345', title: 'Dracula', author: 'Bram Stoker' },
      { id: '1260', title: 'Jane Eyre', author: 'Charlotte Brontë' },
      { id: '768', title: 'Wuthering Heights', author: 'Emily Brontë' },
      { id: '98', title: 'A Tale of Two Cities', author: 'Charles Dickens' },
      { id: '46', title: 'A Christmas Carol', author: 'Charles Dickens' },
      { id: '1400', title: 'Great Expectations', author: 'Charles Dickens' },
      { id: '74', title: 'The Adventures of Tom Sawyer', author: 'Mark Twain' },
      { id: '1232', title: 'The Prince', author: 'Niccolò Machiavelli' },
      { id: '5200', title: 'Metamorphosis', author: 'Franz Kafka' },
      { id: '1497', title: 'The Republic', author: 'Plato' },
      { id: '205', title: 'Walden', author: 'Henry David Thoreau' },
      { id: '16328', title: 'Beowulf', author: 'Unknown' }
    ]
  }

  /**
   * Validate book ID format
   */
  validateBookId(bookId: string): boolean {
    // Basic validation for Project Gutenberg book IDs
    const id = parseInt(bookId)
    return !isNaN(id) && id > 0 && id < 100000
  }

  /**
   * Get offline status message
   */
  getOfflineMessage(): string {
    const settings = privacyManager.getSettings()
    
    if (settings.localOnlyMode) {
      return 'Local-only mode is enabled. Book downloads are disabled for privacy.'
    }
    
    if (!settings.allowGutenbergAPI) {
      return 'Project Gutenberg API is disabled in privacy settings.'
    }
    
    return 'Unable to connect to Project Gutenberg. Check your internet connection.'
  }
}

/**
 * Global instance
 */
export const secureGutenbergAPI = SecureGutenbergAPI.getInstance()

/**
 * Hook for using Gutenberg API with privacy awareness
 */
export function useSecureGutenbergAPI() {
  const checkConnection = async (): Promise<boolean> => {
    try {
      await secureGutenbergAPI.getBookInfo('1') // Test with a known book
      return true
    } catch (error) {
      return false
    }
  }

  const getBookSafely = async (bookId: string): Promise<{
    metadata: BookMetadata | null
    text: string | null
    error: string | null
  }> => {
    try {
      const metadata = await secureGutenbergAPI.getBookInfo(bookId)
      const text = await secureGutenbergAPI.downloadBookText(bookId)
      
      return { metadata, text, error: null }
    } catch (error) {
      const networkError = error instanceof NetworkError ? error : NetworkError.fromFetchError(error as Error)
      return { 
        metadata: null, 
        text: null, 
        error: networkError.toUserMessage() 
      }
    }
  }

  const isAPIEnabled = (): boolean => {
    return privacyManager.getSettings().allowGutenbergAPI
  }

  const isLocalOnlyMode = (): boolean => {
    return privacyManager.getSettings().localOnlyMode
  }

  return {
    checkConnection,
    getBookSafely,
    isAPIEnabled,
    isLocalOnlyMode,
    api: secureGutenbergAPI
  }
}
