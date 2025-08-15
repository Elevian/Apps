import { Router, Request, Response } from 'express'
import { GutenbergService } from '../services/gutenberg'

const router = Router()

/**
 * GET /api/gutenberg/test-network
 * Test network connectivity to external servers
 */
router.get('/test-network', async (req: Request, res: Response) => {
  try {
    console.log(`🧪 [/test-network] Testing network connectivity...`)
    
    // Test basic connectivity
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const testResponse = await fetch('https://example.com/', {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'GutenbergCharacters/1.0'
      }
    })
    
    clearTimeout(timeoutId)
    
    console.log(`✅ [/test-network] Network test successful: ${testResponse.status}`)
    
    res.json({
      networkConnectivity: 'SUCCESS',
      testUrl: 'https://example.com/',
      status: testResponse.status,
      statusText: testResponse.statusText,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.log(`❌ [/test-network] Network test failed:`, error)
    
    res.status(500).json({
      networkConnectivity: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * GET /api/gutenberg/mock/:id
 * Return mock book data for testing when network is blocked
 */
router.get('/mock/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    console.log(`🎭 [/mock/:id] Serving mock data for book ID: ${id}`)
    
    if (!id || !/^\d+$/.test(id)) {
      return res.status(400).json({
        error: 'Invalid book ID. Must be a numeric string.'
      })
    }

    // Mock book data based on common Project Gutenberg books
    const mockBooks: Record<string, any> = {
      '84': {
        id: '84',
        title: 'Frankenstein; Or, The Modern Prometheus',
        author: 'Mary Wollstonecraft Shelley',
        text: `FRANKENSTEIN
OR, THE MODERN PROMETHEUS

by Mary Wollstonecraft Shelley

CHAPTER I

It was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet. It was already one in the morning; the rain pattered dismally against the panes, and my candle was nearly burnt out, when, by the glimmer of the half-extinguished light, I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs.

How can I describe my emotions at this catastrophe, or how delineate the wretch whom with such infinite pains and care I had endeavoured to form? His limbs were in proportion, and I had selected his features as beautiful. Beautiful! Great God! His yellow skin scarcely covered the work of muscles and arteries beneath; his hair was of a lustrous black, and flowing; his teeth of a pearly whiteness; but these luxuriances only formed a more horrid contrast with his watery eyes, that seemed almost of the same colour as the dun-white sockets in which they were set, his shrivelled complexion and straight black lips.

Victor Frankenstein discovered the secret of life and created a monster that would haunt him forever.`,
        wordCount: 195,
        textLength: 1234,
        timestamp: new Date().toISOString(),
        mock: true
      },
      '1342': {
        id: '1342',
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        text: `PRIDE AND PREJUDICE

by Jane Austen

CHAPTER I

It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.

However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.

"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?"

Mr. Bennet replied that he had not.

"But it is," returned she; "for Mrs. Long has just been here, and she told me all about it."

Mr. Bennet made no answer.

"Do you not want to know who has taken it?" cried his wife impatiently.

"You want to tell me, and I have no objection to hearing it."

Elizabeth Bennet must navigate the complex world of 19th century English society.`,
        wordCount: 154,
        textLength: 987,
        timestamp: new Date().toISOString(),
        mock: true
      }
    }

    const mockBook = mockBooks[id]
    if (!mockBook) {
      console.log(`❌ [/mock/:id] No mock data available for book ${id}`)
      return res.status(404).json({
        error: `No mock data available for book ID ${id}`,
        message: 'Mock data only available for books 84 (Frankenstein) and 1342 (Pride and Prejudice)',
        availableMockBooks: Object.keys(mockBooks)
      })
    }

    console.log(`✅ [/mock/:id] Serving mock data for "${mockBook.title}"`)
    res.json(mockBook)

  } catch (error) {
    console.log(`💥 [/mock/:id] Error serving mock data:`, error)
    res.status(500).json({
      error: 'Internal server error while serving mock data'
    })
  }
})

/**
 * GET /api/gutenberg/resolve/:id
 * Find the best .txt URL for a given book ID
 */
router.get('/resolve/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    if (!id || !/^\d+$/.test(id)) {
      return res.status(400).json({
        error: 'Invalid book ID. Must be a numeric string.'
      })
    }

    console.log(`Resolving text URL for book ID: ${id}`)
    
    const result = await GutenbergService.resolveTextUrl(id)
    
    if (!result) {
      return res.status(404).json({
        error: `Could not find working text URL for book ID ${id}`,
        message: 'All attempted URL formats failed to return valid content'
      })
    }

    res.json({
      id,
      url: result.url,
      title: result.title,
      author: result.author,
      timestamp: new Date().toISOString(),
      ...(result.triedUrls && { triedUrls: result.triedUrls })
    })
  } catch (error) {
    console.error('Error in /resolve/:id:', error)
    res.status(500).json({
      error: 'Internal server error while resolving book URL'
    })
  }
})

/**
 * GET /api/gutenberg/text/:id
 * Fetch and return cleaned text content for a given book ID
 */
router.get('/text/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    console.log(`🚀 [/text/:id] Incoming request for book ID: ${id}`)
    console.log(`📋 [/text/:id] Request headers:`, req.headers)
    console.log(`🌐 [/text/:id] Request IP: ${req.ip}`)
    
    if (!id || !/^\d+$/.test(id)) {
      console.log(`❌ [/text/:id] Invalid book ID: "${id}"`)
      return res.status(400).json({
        error: 'Invalid book ID. Must be a numeric string.'
      })
    }

    console.log(`📚 [/text/:id] Starting text fetch for book ID: ${id}`)
    
    const result = await GutenbergService.fetchText(id)
    
    console.log(`📊 [/text/:id] Service result for book ${id}:`, result ? 'SUCCESS' : 'FAILED')
    
    if (!result) {
      console.log(`❌ [/text/:id] No result returned for book ${id}`)
      
      // Determine if this is a network issue vs other problem
      const errorResponse = {
        error: `Unable to fetch book text for ID ${id}`,
        message: 'Backend cannot reach Gutenberg servers or all URL formats failed',
        bookId: id,
        timestamp: new Date().toISOString()
      }
      
      console.log(`📤 [/text/:id] Sending error response:`, errorResponse)
      return res.status(404).json(errorResponse)
    }

    console.log(`✅ [/text/:id] Successfully fetched text for book ${id}`)
    console.log(`📊 [/text/:id] Text length: ${result.text.length}, Word count: ${result.wordCount}`)

    // Return the full text data
    const response = {
      id,
      title: result.title,
      author: result.author,
      text: result.text,
      wordCount: result.wordCount,
      timestamp: new Date().toISOString(),
      textLength: result.text.length,
      ...(result.triedUrls && { triedUrls: result.triedUrls })
    }
    
    console.log(`📤 [/text/:id] Sending success response for book ${id}`)
    res.json(response)
  } catch (error) {
    const { id } = req.params
    console.log(`💥 [/text/:id] Caught exception for book ${id}:`, error)
    
    // Check if it's a network-related error
    let errorMessage = 'Internal server error while fetching book text'
    if (error instanceof Error && error.message.includes('Backend cannot reach')) {
      errorMessage = error.message
    }
    
    const errorResponse = {
      error: errorMessage,
      bookId: id,
      timestamp: new Date().toISOString()
    }
    
    console.log(`📤 [/text/:id] Sending exception response:`, errorResponse)
    res.status(500).json(errorResponse)
  }
})

/**
 * GET /api/gutenberg/text/:id/preview
 * Get a preview (first 1000 characters) of the book text
 */
router.get('/text/:id/preview', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    if (!id || !/^\d+$/.test(id)) {
      return res.status(400).json({
        error: 'Invalid book ID. Must be a numeric string.'
      })
    }

    console.log(`Fetching text preview for book ID: ${id}`)
    
    const result = await GutenbergService.fetchText(id)
    
    if (!result) {
      return res.status(404).json({
        error: `Unable to fetch book text for ID ${id}`,
        message: 'All attempted URL formats failed to return valid content',
        bookId: id
      })
    }

    // Return only a preview of the text
    const preview = result.text.substring(0, 1000)
    const hasMore = result.text.length > 1000

    res.json({
      id,
      title: result.title,
      author: result.author,
      preview,
      hasMore,
      wordCount: result.wordCount,
      fullTextLength: result.text.length,
      timestamp: new Date().toISOString(),
      ...(result.triedUrls && { triedUrls: result.triedUrls })
    })
  } catch (error) {
    console.error('Error in /text/:id/preview:', error)
    res.status(500).json({
      error: 'Internal server error while fetching book preview'
    })
  }
})

export default router
