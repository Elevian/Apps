/**
 * Gutenberg Character Analysis - Express API Server
 * 
 * Available Endpoints:
 * 
 * Health & Monitoring:
 *   GET  /api/health                     - Server health check
 *   GET  /api/analyze/health             - Analysis service health check
 *   GET  /api/analyze/models             - Available analysis models
 * 
 * Gutenberg Books:
 *   GET  /api/gutenberg/resolve/:id      - Get best text URL for book ID
 *   GET  /api/gutenberg/text/:id         - Fetch full book text (cleaned)
 *   GET  /api/gutenberg/text/:id/preview - Fetch book text preview (1000 chars)
 * 
 * Character Analysis:
 *   POST /api/analyze/characters         - Analyze characters in text
 * 
 * Error Handling:
 *   All other routes return 404 with JSON error message
 */

import express from 'express'
import cors from 'cors'
import gutenbergRoutes from './routes/gutenberg'
import analyzeRoutes from './routes/analyze'

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

// Gutenberg routes
app.use('/api/gutenberg', gutenbergRoutes)

// Analysis routes
app.use('/api/analyze', analyzeRoutes)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log('Available endpoints:')
  console.log(`  GET /api/health`)
  console.log(`  GET /api/gutenberg/resolve/:id`)
  console.log(`  GET /api/gutenberg/text/:id`)
  console.log(`  GET /api/gutenberg/text/:id/preview`)
  console.log(`  POST /api/analyze/characters`)
  console.log(`  GET /api/analyze/health`)
  console.log(`  GET /api/analyze/models`)
})
