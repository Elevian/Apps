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
export {};
//# sourceMappingURL=index.d.ts.map