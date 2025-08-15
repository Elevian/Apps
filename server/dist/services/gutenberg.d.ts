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
    private static readonly MIRROR_URLS;
    /**
     * Find the best .txt URL for a given book ID
     */
    static resolveTextUrl(id: string): Promise<{
        url: string;
        title: string;
        author: string;
    } | null>;
    /**
     * Fetch and clean the text content of a book
     */
    static fetchText(id: string): Promise<{
        text: string;
        title: string;
        author: string;
        wordCount: number;
    } | null>;
    /**
     * Find the best text URL from available formats
     */
    private static findBestTextUrl;
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