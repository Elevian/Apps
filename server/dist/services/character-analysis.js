"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterAnalysisService = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const compromise_1 = __importDefault(require("compromise"));
class CharacterAnalysisService {
    /**
     * Main character analysis method with LLM fallback
     */
    static async analyzeCharacters(request) {
        const startTime = Date.now();
        const { text, mode = 'auto', max_characters = 20 } = request;
        // Truncate text if too long
        const truncatedText = text.length > this.MAX_TEXT_LENGTH
            ? text.substring(0, this.MAX_TEXT_LENGTH)
            : text;
        let result;
        try {
            if (mode === 'ollama' || mode === 'auto') {
                // Try Ollama first
                result = await this.analyzeWithOllama(truncatedText, max_characters);
                result.processing_time_ms = Date.now() - startTime;
                return result;
            }
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.log('Ollama analysis failed, falling back to compromise:', errorMsg);
            if (mode === 'ollama') {
                throw new Error(`Ollama analysis failed: ${errorMsg}`);
            }
        }
        // Fallback to compromise
        result = await this.analyzeWithCompromise(truncatedText, max_characters);
        result.processing_time_ms = Date.now() - startTime;
        return result;
    }
    /**
     * Character analysis using Ollama LLM
     */
    static async analyzeWithOllama(text, maxCharacters) {
        // Check if Ollama is available
        try {
            const healthResponse = await (0, node_fetch_1.default)(`${this.OLLAMA_BASE_URL}/api/tags`, {
                signal: AbortSignal.timeout(5000)
            });
            if (!healthResponse.ok) {
                throw new Error('Ollama server not accessible');
            }
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Ollama health check failed: ${errorMsg}`);
        }
        const prompt = `Analyze the following text and extract character names. Return ONLY a JSON array of characters with this exact structure:

[
  {
    "name": "Character Full Name",
    "aliases": ["Alternative name", "Nickname"],
    "importance": 85,
    "mentions": 12,
    "description": "Brief character description"
  }
]

Rules:
- Include only actual character names (people), not places or objects
- "importance" should be 1-100 based on role significance  
- "mentions" should count approximate appearances
- "aliases" can be empty array if no alternatives
- Return maximum ${maxCharacters} most important characters
- Must be valid JSON only, no other text

Text to analyze:
${text.substring(0, 8000)}`;
        try {
            const response = await (0, node_fetch_1.default)(`${this.OLLAMA_BASE_URL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.DEFAULT_MODEL,
                    prompt,
                    stream: false,
                    options: {
                        temperature: 0.1,
                        top_p: 0.9,
                    }
                }),
                signal: AbortSignal.timeout(60000)
            });
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            const llmResponse = data.response;
            // Parse the JSON response
            let characters;
            try {
                // Extract JSON from response (in case there's extra text)
                const jsonMatch = llmResponse.match(/\[[\s\S]*\]/);
                const jsonString = jsonMatch ? jsonMatch[0] : llmResponse;
                characters = JSON.parse(jsonString);
            }
            catch (parseError) {
                console.error('Failed to parse Ollama JSON response:', llmResponse);
                throw new Error('Ollama returned invalid JSON format');
            }
            // Validate and clean the results
            const validCharacters = characters
                .filter(char => char.name && typeof char.name === 'string')
                .map(char => ({
                name: char.name.trim(),
                aliases: Array.isArray(char.aliases) ? char.aliases.filter(a => a && typeof a === 'string') : [],
                importance: Math.max(1, Math.min(100, Number(char.importance) || 50)),
                mentions: Math.max(1, Number(char.mentions) || 1),
                description: char.description || undefined
            }))
                .slice(0, maxCharacters);
            return {
                characters: validCharacters,
                method: 'ollama',
                processing_time_ms: 0, // Will be set by caller
                text_length: text.length,
                total_characters: validCharacters.length
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Ollama processing failed: ${errorMsg}`);
        }
    }
    /**
     * Character analysis using compromise.js as fallback
     */
    static async analyzeWithCompromise(text, maxCharacters) {
        const doc = (0, compromise_1.default)(text);
        // Extract person names
        const people = doc.people();
        const places = doc.places(); // To filter out place names
        // Get all person entities
        const personEntities = people.json();
        const placeNames = new Set(places.out('array'));
        // Count mentions and build character map
        const characterMap = new Map();
        // Process each sentence to find name mentions
        const sentences = doc.sentences().json();
        for (const entity of personEntities) {
            const name = entity.text.trim();
            // Skip if it's likely a place name
            if (placeNames.has(name))
                continue;
            // Skip single letters or very short names
            if (name.length < 2)
                continue;
            // Skip common words that might be misidentified
            const commonWords = ['he', 'she', 'it', 'they', 'we', 'i', 'you', 'the', 'and', 'or', 'but'];
            if (commonWords.includes(name.toLowerCase()))
                continue;
            // Count mentions in text
            const mentions = this.countMentions(text, name);
            if (mentions > 0) {
                const aliases = this.findAliases(text, name);
                const importance = this.calculateImportance(mentions, text.length, name);
                characterMap.set(name, {
                    name,
                    aliases,
                    importance,
                    mentions,
                    description: `Character appearing ${mentions} times in the text`
                });
            }
        }
        // Also look for quoted speech to find additional characters
        const quotedSpeech = text.match(/"[^"]*"/g) || [];
        for (const quote of quotedSpeech) {
            // Look for attribution patterns like 'said John', 'Mary replied'
            const attribution = text.match(new RegExp(`${quote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.!?]*?(?:said|replied|asked|whispered|shouted|exclaimed)\\s+([A-Z][a-z]+)`, 'i'));
            if (attribution && attribution[1]) {
                const name = attribution[1].trim();
                if (name.length > 1 && !placeNames.has(name)) {
                    const mentions = this.countMentions(text, name);
                    if (mentions > 1) {
                        const existing = characterMap.get(name);
                        if (!existing) {
                            characterMap.set(name, {
                                name,
                                aliases: [],
                                importance: this.calculateImportance(mentions, text.length, name),
                                mentions,
                                description: `Character with dialogue`
                            });
                        }
                    }
                }
            }
        }
        // Convert to array and sort by importance
        const characters = Array.from(characterMap.values())
            .sort((a, b) => b.importance - a.importance)
            .slice(0, maxCharacters);
        return {
            characters,
            method: 'compromise',
            processing_time_ms: 0, // Will be set by caller
            text_length: text.length,
            total_characters: characters.length
        };
    }
    /**
     * Count mentions of a character name in text
     */
    static countMentions(text, name) {
        const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = text.match(regex);
        return matches ? matches.length : 0;
    }
    /**
     * Find alternative names/aliases for a character
     */
    static findAliases(text, mainName) {
        const aliases = new Set();
        // Look for patterns like "John Smith, also known as..." or "Mr. Smith"
        const firstName = mainName.split(' ')[0];
        const lastName = mainName.split(' ').slice(1).join(' ');
        if (firstName && lastName) {
            // Check for title + last name patterns
            const titlePatterns = ['Mr.', 'Mrs.', 'Miss', 'Dr.', 'Sir', 'Lord', 'Lady'];
            for (const title of titlePatterns) {
                if (this.countMentions(text, `${title} ${lastName}`) > 0) {
                    aliases.add(`${title} ${lastName}`);
                }
            }
            // Check for just first name usage
            if (this.countMentions(text, firstName) > this.countMentions(text, mainName)) {
                aliases.add(firstName);
            }
        }
        return Array.from(aliases).slice(0, 3); // Limit aliases
    }
    /**
     * Calculate character importance based on mentions and context
     */
    static calculateImportance(mentions, textLength, name) {
        // Base importance on mention frequency
        const mentionFrequency = mentions / (textLength / 1000); // mentions per 1000 characters
        let importance = Math.min(100, mentionFrequency * 20);
        // Boost for common important name patterns
        if (name.split(' ').length > 1)
            importance += 10; // Full names are more important
        if (mentions > 10)
            importance += 15; // Frequently mentioned
        if (mentions > 20)
            importance += 15; // Very frequently mentioned
        return Math.max(1, Math.min(100, Math.round(importance)));
    }
}
exports.CharacterAnalysisService = CharacterAnalysisService;
CharacterAnalysisService.OLLAMA_BASE_URL = 'http://localhost:11434';
CharacterAnalysisService.DEFAULT_MODEL = 'llama3.2';
CharacterAnalysisService.MAX_TEXT_LENGTH = 50000; // Limit text for processing
//# sourceMappingURL=character-analysis.js.map