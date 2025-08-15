"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const character_analysis_1 = require("../services/character-analysis");
const router = (0, express_1.Router)();
/**
 * POST /api/analyze/characters
 * Extract characters from text using LLM or fallback
 */
router.post('/characters', async (req, res) => {
    try {
        const { text, mode, max_characters } = req.body;
        // Validation
        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                error: 'Missing or invalid text field',
                details: 'Request must include a text field with string content'
            });
        }
        if (text.length < 100) {
            return res.status(400).json({
                error: 'Text too short',
                details: 'Text must be at least 100 characters long for character analysis'
            });
        }
        if (text.length > 200000) {
            return res.status(400).json({
                error: 'Text too long',
                details: 'Text must be less than 200,000 characters. Consider analyzing in chunks.'
            });
        }
        const validModes = ['ollama', 'auto'];
        if (mode && !validModes.includes(mode)) {
            return res.status(400).json({
                error: 'Invalid mode',
                details: `Mode must be one of: ${validModes.join(', ')}`
            });
        }
        const maxChars = max_characters || 20;
        if (maxChars < 1 || maxChars > 50) {
            return res.status(400).json({
                error: 'Invalid max_characters',
                details: 'max_characters must be between 1 and 50'
            });
        }
        console.log(`Analyzing characters in ${text.length} character text using mode: ${mode || 'auto'}`);
        // Perform character analysis
        const result = await character_analysis_1.CharacterAnalysisService.analyzeCharacters({
            text,
            mode: mode,
            max_characters: maxChars
        });
        // Log results
        console.log(`Character analysis complete: ${result.total_characters} characters found using ${result.method} in ${result.processing_time_ms}ms`);
        res.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Character analysis error:', error);
        let statusCode = 500;
        let errorMessage = 'Internal server error during character analysis';
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        if (errorMsg.includes('Ollama')) {
            statusCode = 503;
            errorMessage = 'LLM service unavailable';
        }
        else if (errorMsg.includes('timeout')) {
            statusCode = 504;
            errorMessage = 'Analysis timeout - text may be too complex';
        }
        res.status(statusCode).json({
            error: errorMessage,
            details: errorMsg,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * GET /api/analyze/health
 * Check availability of analysis services
 */
router.get('/health', async (req, res) => {
    const health = {
        compromise: true, // Always available since it's local
        ollama: false,
        timestamp: new Date().toISOString()
    };
    // Check Ollama availability
    try {
        const fetch = (await Promise.resolve().then(() => __importStar(require('node-fetch')))).default;
        const response = await fetch('http://localhost:11434/api/tags', {
            signal: AbortSignal.timeout(3000)
        });
        health.ollama = response.ok;
    }
    catch (error) {
        health.ollama = false;
    }
    res.json(health);
});
/**
 * GET /api/analyze/models
 * List available models (if Ollama is running)
 */
router.get('/models', async (req, res) => {
    try {
        const fetch = (await Promise.resolve().then(() => __importStar(require('node-fetch')))).default;
        const response = await fetch('http://localhost:11434/api/tags', {
            signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) {
            return res.status(503).json({
                error: 'Ollama service unavailable',
                details: 'Cannot connect to Ollama at http://localhost:11434'
            });
        }
        const data = await response.json();
        res.json({
            available: true,
            models: data.models || [],
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        res.status(503).json({
            available: false,
            error: 'Ollama service unavailable',
            details: errorMsg,
            timestamp: new Date().toISOString()
        });
    }
});
exports.default = router;
//# sourceMappingURL=analyze.js.map