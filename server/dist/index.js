"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const gutenberg_1 = __importDefault(require("./routes/gutenberg"));
const analyze_1 = __importDefault(require("./routes/analyze"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});
// Gutenberg routes
app.use('/api/gutenberg', gutenberg_1.default);
// Analysis routes
app.use('/api/analyze', analyze_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log(`  GET /api/health`);
    console.log(`  GET /api/gutenberg/resolve/:id`);
    console.log(`  GET /api/gutenberg/text/:id`);
    console.log(`  GET /api/gutenberg/text/:id/preview`);
    console.log(`  POST /api/analyze/characters`);
    console.log(`  GET /api/analyze/health`);
    console.log(`  GET /api/analyze/models`);
});
//# sourceMappingURL=index.js.map