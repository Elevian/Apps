export interface GutenbergBook {
    id: number;
    title: string;
    authors: Array<{
        name: string;
    }>;
    formats: Record<string, string>;
    subjects: string[];
    languages: string[];
}
export interface GutenbergResponse {
    results: GutenbergBook[];
}
export declare class GutenbergService {
    private static readonly BASE_URL;
    private static readonly FALLBACK_BASE_URL;
    private static readonly MAX_TEXT_LENGTH;
    /**
     * Find the best .txt URL for a given book ID
     */
    static resolveTextUrl(id: string): Promise<{
        url: string;
        title: string;
        author: string;
        triedUrls?: string[];
    } | null>;
    /**
     * Fetch and clean the text content of a book with comprehensive fallback
     */
    static fetchText(id: string): Promise<{
        text: string;
        title: string;
        author: string;
        wordCount: number;
        triedUrls?: string[];
        source?: string;
    } | null>;
    /**
     * Strategy 1: Try direct Gutenberg fetch with multiple retries and URL patterns
     */
    private static tryDirectGutenbergFetch;
    /**
     * Strategy 2: Use Gutendx API to get proper URLs
     */
    private static tryGutendxApproach;
    /**
     * Strategy 3: Use mock data for known books
     */
    private static tryMockData;
    /**
     * Generate all possible Gutenberg URL patterns for a book ID
     */
    private static generateAllPossibleUrls;
    /**
     * Try a single URL with retry logic and text truncation
     */
    private static tryUrlWithRetries;
    /**
     * Find a working text URL by trying multiple formats
     */
    private static findWorkingTextUrl;
    /**
     * Extract text URLs from API format data
     */
    private static extractTextUrlsFromFormats;
    /**
     * Test if a URL returns valid content
     */
    private static testUrl;
    /**
     * Extract title and author from Project Gutenberg text headers
     */
    private static extractMetadataFromText;
    /**
     * Clean Gutenberg text by removing headers and footers
     */
    private static cleanGutenbergText;
    /**
     * Count words in text
     */
    private static countWords;
}
//# sourceMappingURL=gutenberg.d.ts.map