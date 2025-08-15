export interface Character {
    name: string;
    aliases: string[];
    importance: number;
    mentions: number;
    description?: string;
}
export interface CharacterAnalysisResult {
    characters: Character[];
    method: 'ollama' | 'compromise';
    processing_time_ms: number;
    text_length: number;
    total_characters: number;
}
export interface AnalysisRequest {
    text: string;
    mode?: 'ollama' | 'auto';
    max_characters?: number;
}
export declare class CharacterAnalysisService {
    private static readonly OLLAMA_BASE_URL;
    private static readonly DEFAULT_MODEL;
    private static readonly MAX_TEXT_LENGTH;
    /**
     * Main character analysis method with LLM fallback
     */
    static analyzeCharacters(request: AnalysisRequest): Promise<CharacterAnalysisResult>;
    /**
     * Character analysis using Ollama LLM
     */
    private static analyzeWithOllama;
    /**
     * Character analysis using compromise.js as fallback
     */
    private static analyzeWithCompromise;
    /**
     * Count mentions of a character name in text
     */
    private static countMentions;
    /**
     * Find alternative names/aliases for a character
     */
    private static findAliases;
    /**
     * Calculate character importance based on mentions and context
     */
    private static calculateImportance;
}
//# sourceMappingURL=character-analysis.d.ts.map