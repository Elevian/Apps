import { Router, Request, Response } from 'express'
import { CharacterAnalysisService, AnalysisRequest } from '../services/character-analysis'

const router = Router()

/**
 * POST /api/analyze/characters
 * Extract characters from text using LLM or fallback
 */
router.post('/characters', async (req: Request, res: Response) => {
  try {
    const { text, mode, max_characters } = req.body as AnalysisRequest

    // Validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid text field',
        details: 'Request must include a text field with string content'
      })
    }

    if (text.length < 100) {
      return res.status(400).json({
        error: 'Text too short',
        details: 'Text must be at least 100 characters long for character analysis'
      })
    }

    if (text.length > 200000) {
      return res.status(400).json({
        error: 'Text too long',
        details: 'Text must be less than 200,000 characters. Consider analyzing in chunks.'
      })
    }

    const validModes = ['ollama', 'auto']
    if (mode && !validModes.includes(mode)) {
      return res.status(400).json({
        error: 'Invalid mode',
        details: `Mode must be one of: ${validModes.join(', ')}`
      })
    }

    const maxChars = max_characters || 20
    if (maxChars < 1 || maxChars > 50) {
      return res.status(400).json({
        error: 'Invalid max_characters',
        details: 'max_characters must be between 1 and 50'
      })
    }

    console.log(`Analyzing characters in ${text.length} character text using mode: ${mode || 'auto'}`)

    // Perform character analysis
    const result = await CharacterAnalysisService.analyzeCharacters({
      text,
      mode: mode as 'ollama' | 'auto',
      max_characters: maxChars
    })

    // Log results
    console.log(`Character analysis complete: ${result.total_characters} characters found using ${result.method} in ${result.processing_time_ms}ms`)

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Character analysis error:', error)
    
    let statusCode = 500
    let errorMessage = 'Internal server error during character analysis'
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMsg.includes('Ollama')) {
      statusCode = 503
      errorMessage = 'LLM service unavailable'
    } else if (errorMsg.includes('timeout')) {
      statusCode = 504
      errorMessage = 'Analysis timeout - text may be too complex'
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: errorMsg,
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * GET /api/analyze/health
 * Check availability of analysis services
 */
router.get('/health', async (req: Request, res: Response) => {
  const health = {
    compromise: true, // Always available since it's local
    ollama: false,
    timestamp: new Date().toISOString()
  }

  // Check Ollama availability
  try {
    const fetch = (await import('node-fetch')).default
    const response = await fetch('http://localhost:11434/api/tags', {
      signal: AbortSignal.timeout(3000)
    })
    health.ollama = response.ok
  } catch (error) {
    health.ollama = false
  }

  res.json(health)
})

/**
 * GET /api/analyze/models
 * List available models (if Ollama is running)
 */
router.get('/models', async (req: Request, res: Response) => {
  try {
    const fetch = (await import('node-fetch')).default
    const response = await fetch('http://localhost:11434/api/tags', {
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) {
      return res.status(503).json({
        error: 'Ollama service unavailable',
        details: 'Cannot connect to Ollama at http://localhost:11434'
      })
    }

    const data = await response.json() as { models?: any[] }
    res.json({
      available: true,
      models: data.models || [],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    res.status(503).json({
      available: false,
      error: 'Ollama service unavailable',
      details: errorMsg,
      timestamp: new Date().toISOString()
    })
  }
})

export default router
