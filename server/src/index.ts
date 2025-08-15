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
import path from 'path'
import fs from 'fs'
import compression from 'compression'
import gutenbergRoutes from './routes/gutenberg'
import analyzeRoutes from './routes/analyze'

const app = express()
const PORT = process.env.PORT || 10000

// Middleware
app.use(compression())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true // Allow all origins in production (Render will handle this)
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
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

// Root health check for Render
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    service: 'gutenberg-characters-api'
  })
})

// Gutenberg routes
app.use('/api/gutenberg', gutenbergRoutes)

// Analysis routes
app.use('/api/analyze', analyzeRoutes)

// Add a catch-all for API routes that don't exist
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/gutenberg/resolve/:id',
      'GET /api/gutenberg/text/:id',
      'GET /api/gutenberg/text/:id/preview',
      'POST /api/analyze/characters',
      'GET /api/analyze/health',
      'GET /api/analyze/models'
    ]
  })
})

// Serve static files from client build
// Try multiple possible locations for the client build
const possibleClientPaths = [
  path.join(__dirname, 'client'),                     // Runtime location: server/dist/client
  path.join(__dirname, '../client'),                  // Alternative: server/client
  path.join(__dirname, '../../client/dist'),          // Relative to server/dist
  path.join(__dirname, '../client/dist'),             // Relative to server/dist (alternative)
  path.join(__dirname, '../client-dist'),             // Copied client files in server directory
  path.join(process.cwd(), 'client/dist'),            // From project root
  path.join(process.cwd(), '../client/dist'),         // From project root (alternative)
  './client-dist',                                     // Current working directory (copied files)
  './client/dist'                                      // Current working directory
]

let clientDistPath: string | null = null

// Find the first valid client build path
for (const clientPath of possibleClientPaths) {
  const indexPath = path.join(clientPath, 'index.html')
  if (fs.existsSync(indexPath)) {
    clientDistPath = clientPath
    console.log(`✅ Found client build at: ${clientPath}`)
    break
  }
}

if (clientDistPath) {
  console.log(`📁 Serving static files from: ${clientDistPath}`)
  app.use(express.static(clientDistPath))
  
  // Handle client routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      const indexPath = path.join(clientDistPath!, 'index.html')
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath)
      } else {
        console.error(`❌ index.html not found at: ${indexPath}`)
        res.status(404).json({ 
          error: 'Client build index.html not found',
          searchedPath: indexPath,
          clientPath: clientDistPath
        })
      }
    }
  })
} else {
  console.error('❌ Client build not found in any of these locations:')
  possibleClientPaths.forEach(path => console.error(`   - ${path}`))
  
  // Serve a helpful error page instead of crashing
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.status(404).json({ 
        error: 'Client build not found',
        searchedPaths: possibleClientPaths,
        currentDir: __dirname,
        workingDir: process.cwd()
      })
    }
  })
}

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
