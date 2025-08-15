import { 
  BookResolve, 
  BookText, 
  BookPreview, 
  BookResolveSchema,
  BookTextSchema,
  BookPreviewSchema,
  BookIdSchema,
  ApiErrorSchema,
  CharacterAnalysisResult,
  CharacterAnalysisRequest,
  CharacterAnalysisResultSchema,
  CharacterAnalysisRequestSchema,
  AnalysisHealth,
  AnalysisHealthSchema
} from './schemas'
import { API_BASE_URL, ENDPOINTS } from '../config/api'

export class GutenbergApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'GutenbergApiError'
  }
}

async function fetchApi<T>(url: string, schema: any): Promise<T> {
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorData = await response.json()
        const validatedError = ApiErrorSchema.safeParse(errorData)
        if (validatedError.success) {
          errorMessage = validatedError.data.error
        }
      } catch {
        // Use default error message if parsing fails
      }
      
      throw new GutenbergApiError(errorMessage, response.status)
    }

    const data = await response.json()
    const result = schema.safeParse(data)
    
    if (!result.success) {
      console.error('API Response validation failed:', result.error)
      throw new GutenbergApiError(
        'Invalid response format from server',
        500,
        'VALIDATION_ERROR'
      )
    }

    return result.data
  } catch (error) {
    if (error instanceof GutenbergApiError) {
      throw error
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new GutenbergApiError(
        'Unable to connect to server. Please check if the server is running.',
        0,
        'CONNECTION_ERROR'
      )
    }
    
    throw new GutenbergApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      500,
      'UNKNOWN_ERROR'
    )
  }
}

async function fetchApiPost<T>(url: string, body: any, schema: any): Promise<T> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorData = await response.json()
        const validatedError = ApiErrorSchema.safeParse(errorData)
        if (validatedError.success) {
          errorMessage = validatedError.data.error
        }
      } catch {
        // Use default error message if parsing fails
      }
      
      throw new GutenbergApiError(errorMessage, response.status)
    }

    const data = await response.json()
    const result = schema.safeParse(data)
    
    if (!result.success) {
      console.error('API Response validation failed:', result.error)
      throw new GutenbergApiError(
        'Invalid response format from server',
        500,
        'VALIDATION_ERROR'
      )
    }

    return result.data
  } catch (error) {
    if (error instanceof GutenbergApiError) {
      throw error
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new GutenbergApiError(
        'Unable to connect to server. Please check if the server is running.',
        0,
        'CONNECTION_ERROR'
      )
    }
    
    throw new GutenbergApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      500,
      'UNKNOWN_ERROR'
    )
  }
}

export const gutenbergApi = {
  /**
   * Resolve the best text URL for a book ID
   */
  async resolveBook(id: string): Promise<BookResolve> {
    const validatedId = BookIdSchema.parse({ id })
    const url = ENDPOINTS.gutenberg.resolve(validatedId.id)
    return fetchApi<BookResolve>(url, BookResolveSchema)
  },

  /**
   * Fetch full text for a book ID
   */
  async fetchText(id: string): Promise<BookText> {
    const validatedId = BookIdSchema.parse({ id })
    const url = ENDPOINTS.gutenberg.text(validatedId.id)
    return fetchApi<BookText>(url, BookTextSchema)
  },

  /**
   * Fetch preview text for a book ID
   */
  async fetchPreview(id: string): Promise<BookPreview> {
    const validatedId = BookIdSchema.parse({ id })
    const url = ENDPOINTS.gutenberg.preview(validatedId.id)
    return fetchApi<BookPreview>(url, BookPreviewSchema)
  },
}

export const analysisApi = {
  /**
   * Analyze characters in text
   */
  async analyzeCharacters(request: CharacterAnalysisRequest): Promise<CharacterAnalysisResult> {
    const validatedRequest = CharacterAnalysisRequestSchema.parse(request)
    const url = ENDPOINTS.analysis.characters
    return fetchApiPost<CharacterAnalysisResult>(url, validatedRequest, CharacterAnalysisResultSchema)
  },

  /**
   * Check analysis service health
   */
  async getHealth(): Promise<AnalysisHealth> {
    const url = ENDPOINTS.analysis.health
    return fetchApi<AnalysisHealth>(url, AnalysisHealthSchema)
  },
}
