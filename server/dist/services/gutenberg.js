"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GutenbergService = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
class GutenbergService {
    /**
     * Find the best .txt URL for a given book ID
     */
    static async resolveTextUrl(id) {
        try {
            // First, get book metadata from Gutendex API
            const metadataUrl = `${this.BASE_URL}/${id}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const metadataResponse = await (0, node_fetch_1.default)(metadataUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'GutenbergCharacters/1.0'
                }
            });
            clearTimeout(timeoutId);
            if (!metadataResponse.ok) {
                throw new Error(`Metadata fetch failed: ${metadataResponse.status}`);
            }
            const book = await metadataResponse.json();
            // Extract book info
            const title = book.title || 'Unknown Title';
            const author = book.authors?.[0]?.name || 'Unknown Author';
            // Find the best text format URL
            const textUrl = this.findBestTextUrl(book.formats, id);
            if (!textUrl) {
                throw new Error('No suitable text format found');
            }
            return { url: textUrl, title, author };
        }
        catch (error) {
            console.error(`Failed to resolve text URL for book ${id}:`, error);
            return null;
        }
    }
    /**
     * Fetch and clean the text content of a book
     */
    static async fetchText(id) {
        try {
            // First resolve the text URL
            const resolved = await this.resolveTextUrl(id);
            if (!resolved) {
                throw new Error('Could not resolve text URL');
            }
            // Fetch the actual text content
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            const textResponse = await (0, node_fetch_1.default)(resolved.url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'GutenbergCharacters/1.0'
                }
            });
            clearTimeout(timeoutId);
            if (!textResponse.ok) {
                throw new Error(`Text fetch failed: ${textResponse.status}`);
            }
            const rawText = await textResponse.text();
            // Clean the text (remove Gutenberg headers/footers)
            const cleanedText = this.cleanGutenbergText(rawText);
            const wordCount = this.countWords(cleanedText);
            return {
                text: cleanedText,
                title: resolved.title,
                author: resolved.author,
                wordCount
            };
        }
        catch (error) {
            console.error(`Failed to fetch text for book ${id}:`, error);
            return null;
        }
    }
    /**
     * Find the best text URL from available formats
     */
    static findBestTextUrl(formats, id) {
        // Priority order for text formats
        const priorities = [
            'text/plain; charset=utf-8',
            'text/plain',
            'text/plain; charset=us-ascii',
            'application/octet-stream'
        ];
        // First try to find by MIME type
        for (const mimeType of priorities) {
            if (formats[mimeType]) {
                return formats[mimeType];
            }
        }
        // Fallback: look for .txt files in the formats object
        for (const [, url] of Object.entries(formats)) {
            if (url.includes('.txt')) {
                return url;
            }
        }
        // Final fallback: construct standard Gutenberg URLs
        const fallbackUrls = [
            `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
            `https://www.gutenberg.org/files/${id}/${id}.txt`,
            `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`
        ];
        // Return the first fallback URL (we'll test it when fetching)
        return fallbackUrls[0];
    }
    /**
     * Clean Gutenberg text by removing headers and footers
     */
    static cleanGutenbergText(text) {
        let cleaned = text;
        // Remove Project Gutenberg header (START markers)
        const startMarkers = [
            /\*\*\* START OF TH[EI]S? PROJECT GUTENBERG EBOOK .+ \*\*\*/i,
            /\*\*\* START OF THE PROJECT GUTENBERG EBOOK .+ \*\*\*/i,
            /\*\*\*START OF THE PROJECT GUTENBERG EBOOK .+ \*\*\*/i,
            /\*\*\* START OF THIS PROJECT GUTENBERG EBOOK .+ \*\*\*/i
        ];
        for (const marker of startMarkers) {
            const match = cleaned.match(marker);
            if (match) {
                const startIndex = match.index + match[0].length;
                cleaned = cleaned.substring(startIndex);
                break;
            }
        }
        // Remove Project Gutenberg footer (END markers)
        const endMarkers = [
            /\*\*\* END OF TH[EI]S? PROJECT GUTENBERG EBOOK .+ \*\*\*/i,
            /\*\*\* END OF THE PROJECT GUTENBERG EBOOK .+ \*\*\*/i,
            /\*\*\*END OF THE PROJECT GUTENBERG EBOOK .+ \*\*\*/i,
            /\*\*\* END OF THIS PROJECT GUTENBERG EBOOK .+ \*\*\*/i
        ];
        for (const marker of endMarkers) {
            const match = cleaned.match(marker);
            if (match) {
                cleaned = cleaned.substring(0, match.index);
                break;
            }
        }
        // Clean up extra whitespace and normalize line endings
        cleaned = cleaned
            .replace(/\r\n/g, '\n') // Normalize line endings
            .replace(/\r/g, '\n') // Handle old Mac line endings
            .replace(/\n{3,}/g, '\n\n') // Reduce multiple line breaks
            .trim();
        return cleaned;
    }
    /**
     * Count words in text
     */
    static countWords(text) {
        return text
            .split(/\s+/)
            .filter(word => word.length > 0)
            .length;
    }
}
exports.GutenbergService = GutenbergService;
GutenbergService.BASE_URL = 'https://gutendex.com/books';
GutenbergService.MIRROR_URLS = [
    'https://www.gutenberg.org/ebooks',
    'https://www.gutenberg.org/files'
];
//# sourceMappingURL=gutenberg.js.map