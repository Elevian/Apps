"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gutenberg_1 = require("../services/gutenberg");
const router = (0, express_1.Router)();
/**
 * GET /api/gutenberg/resolve/:id
 * Find the best .txt URL for a given book ID
 */
router.get('/resolve/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || !/^\d+$/.test(id)) {
            return res.status(400).json({
                error: 'Invalid book ID. Must be a numeric string.'
            });
        }
        console.log(`Resolving text URL for book ID: ${id}`);
        const result = await gutenberg_1.GutenbergService.resolveTextUrl(id);
        if (!result) {
            return res.status(404).json({
                error: `Could not find text URL for book ID ${id}`
            });
        }
        res.json({
            id,
            url: result.url,
            title: result.title,
            author: result.author,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in /resolve/:id:', error);
        res.status(500).json({
            error: 'Internal server error while resolving book URL'
        });
    }
});
/**
 * GET /api/gutenberg/text/:id
 * Fetch and return cleaned text content for a given book ID
 */
router.get('/text/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || !/^\d+$/.test(id)) {
            return res.status(400).json({
                error: 'Invalid book ID. Must be a numeric string.'
            });
        }
        console.log(`Fetching text for book ID: ${id}`);
        const result = await gutenberg_1.GutenbergService.fetchText(id);
        if (!result) {
            return res.status(404).json({
                error: `Could not fetch text for book ID ${id}`
            });
        }
        // Return the full text data
        res.json({
            id,
            title: result.title,
            author: result.author,
            text: result.text,
            wordCount: result.wordCount,
            timestamp: new Date().toISOString(),
            textLength: result.text.length
        });
    }
    catch (error) {
        console.error('Error in /text/:id:', error);
        res.status(500).json({
            error: 'Internal server error while fetching book text'
        });
    }
});
/**
 * GET /api/gutenberg/text/:id/preview
 * Get a preview (first 1000 characters) of the book text
 */
router.get('/text/:id/preview', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || !/^\d+$/.test(id)) {
            return res.status(400).json({
                error: 'Invalid book ID. Must be a numeric string.'
            });
        }
        console.log(`Fetching text preview for book ID: ${id}`);
        const result = await gutenberg_1.GutenbergService.fetchText(id);
        if (!result) {
            return res.status(404).json({
                error: `Could not fetch text for book ID ${id}`
            });
        }
        // Return only a preview of the text
        const preview = result.text.substring(0, 1000);
        const hasMore = result.text.length > 1000;
        res.json({
            id,
            title: result.title,
            author: result.author,
            preview,
            hasMore,
            wordCount: result.wordCount,
            fullTextLength: result.text.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in /text/:id/preview:', error);
        res.status(500).json({
            error: 'Internal server error while fetching book preview'
        });
    }
});
exports.default = router;
//# sourceMappingURL=gutenberg.js.map