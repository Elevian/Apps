"use strict";
// Using Node.js 18+ built-in fetch
Object.defineProperty(exports, "__esModule", { value: true });
exports.GutenbergService = void 0;
class GutenbergService {
    /**
     * Find the best .txt URL for a given book ID
     */
    static async resolveTextUrl(id) {
        const triedUrls = [];
        try {
            // Try to get book metadata from Gutendx API first
            let book = null;
            try {
                const metadataUrl = `${this.BASE_URL}/${id}`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                const metadataResponse = await fetch(metadataUrl, {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'GutenbergCharacters/1.0'
                    }
                });
                clearTimeout(timeoutId);
                if (metadataResponse.ok) {
                    book = await metadataResponse.json();
                }
            }
            catch (apiError) {
                console.log(`Gutendx API unavailable for book ${id}, using fallback approach`);
            }
            // Extract book info (use defaults if API failed)
            const title = book?.title || `Book ${id}`;
            const author = book?.authors?.[0]?.name || 'Unknown Author';
            // Try to find working text URL using multiple strategies
            const workingUrl = await this.findWorkingTextUrl(book?.formats || {}, id, triedUrls);
            if (!workingUrl) {
                console.error(`No working text URL found for book ${id}. Tried URLs:`, triedUrls);
                return null;
            }
            return { url: workingUrl, title, author, triedUrls };
        }
        catch (error) {
            console.error(`Failed to resolve text URL for book ${id}:`, error);
            return null;
        }
    }
    /**
     * Fetch and clean the text content of a book with comprehensive fallback
     */
    static async fetchText(id) {
        console.log(`📚 [fetchText] Starting comprehensive text fetch for book ID: ${id}`);
        // Strategy 1: Try direct Gutenberg fetch with multiple URL patterns
        const directResult = await this.tryDirectGutenbergFetch(id);
        if (directResult) {
            console.log(`✅ [fetchText] Success with direct Gutenberg fetch for book ${id}`);
            return { ...directResult, source: 'gutenberg' };
        }
        // Strategy 2: Try with Gutendx API for better URL resolution
        console.log(`🔄 [fetchText] Direct fetch failed, trying Gutendx API approach for book ${id}`);
        const gutendxResult = await this.tryGutendxApproach(id);
        if (gutendxResult) {
            console.log(`✅ [fetchText] Success with Gutendx API approach for book ${id}`);
            return { ...gutendxResult, source: 'gutendx' };
        }
        // Strategy 3: Fallback to mock data for known books
        console.log(`🎭 [fetchText] All network approaches failed, trying mock data for book ${id}`);
        const mockResult = await this.tryMockData(id);
        if (mockResult) {
            console.log(`✅ [fetchText] Success with mock data for book ${id}`);
            return { ...mockResult, source: 'mock' };
        }
        console.log(`❌ [fetchText] All strategies failed for book ${id}`);
        return null;
    }
    /**
     * Strategy 1: Try direct Gutenberg fetch with multiple retries and URL patterns
     */
    static async tryDirectGutenbergFetch(id) {
        console.log(`🎯 [tryDirectGutenbergFetch] Attempting direct fetch for book ${id}`);
        const triedUrls = [];
        try {
            // Get comprehensive list of URLs to try
            const urlsToTry = this.generateAllPossibleUrls(id);
            console.log(`📋 [tryDirectGutenbergFetch] Generated ${urlsToTry.length} URLs to try for book ${id}`);
            // Try each URL with retries
            for (const url of urlsToTry) {
                const result = await this.tryUrlWithRetries(url, id, triedUrls);
                if (result) {
                    console.log(`✅ [tryDirectGutenbergFetch] Successfully fetched from ${url}`);
                    return { ...result, triedUrls };
                }
            }
            console.log(`❌ [tryDirectGutenbergFetch] All URLs failed for book ${id}`);
            return null;
        }
        catch (error) {
            console.log(`💥 [tryDirectGutenbergFetch] Exception for book ${id}:`, error);
            return null;
        }
    }
    /**
     * Strategy 2: Use Gutendx API to get proper URLs
     */
    static async tryGutendxApproach(id) {
        console.log(`🌐 [tryGutendxApproach] Attempting Gutendx API approach for book ${id}`);
        const triedUrls = [];
        try {
            // Try to get metadata from Gutendx API with multiple endpoints
            const gutendxUrls = [
                `https://gutendx.com/books/${id}`,
                `https://www.gutendx.com/books/${id}`,
                `http://gutendx.com/books/${id}` // HTTP fallback
            ];
            let bookMetadata = null;
            for (const apiUrl of gutendxUrls) {
                try {
                    console.log(`📡 [tryGutendxApproach] Trying Gutendx API: ${apiUrl}`);
                    triedUrls.push(apiUrl);
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000);
                    const response = await fetch(apiUrl, {
                        signal: controller.signal,
                        headers: { 'User-Agent': 'GutenbergCharacters/1.0' }
                    });
                    clearTimeout(timeoutId);
                    if (response.ok) {
                        bookMetadata = await response.json();
                        console.log(`✅ [tryGutendxApproach] Got metadata from ${apiUrl}`);
                        break;
                    }
                }
                catch (apiError) {
                    console.log(`⚠️ [tryGutendxApproach] API ${apiUrl} failed:`, apiError instanceof Error ? apiError.message : 'Unknown error');
                }
            }
            if (!bookMetadata) {
                console.log(`❌ [tryGutendxApproach] All Gutendx API endpoints failed for book ${id}`);
                return null;
            }
            // Extract text URLs from metadata
            const textUrls = this.extractTextUrlsFromFormats(bookMetadata.formats || {});
            console.log(`📋 [tryGutendxApproach] Found ${textUrls.length} text URLs from API`);
            // Try each URL from the API
            for (const url of textUrls) {
                const result = await this.tryUrlWithRetries(url, id, triedUrls);
                if (result) {
                    console.log(`✅ [tryGutendxApproach] Successfully fetched from API URL: ${url}`);
                    // Use metadata from API
                    return {
                        ...result,
                        title: bookMetadata.title || result.title,
                        author: bookMetadata.authors?.[0]?.name || result.author,
                        triedUrls
                    };
                }
            }
            console.log(`❌ [tryGutendxApproach] All API URLs failed for book ${id}`);
            return null;
        }
        catch (error) {
            console.log(`💥 [tryGutendxApproach] Exception for book ${id}:`, error);
            return null;
        }
    }
    /**
     * Strategy 3: Use mock data for known books
     */
    static async tryMockData(id) {
        console.log(`🎭 [tryMockData] Checking mock data for book ${id}`);
        const mockBooks = {
            '84': {
                title: 'Frankenstein; Or, The Modern Prometheus',
                author: 'Mary Wollstonecraft Shelley',
                text: `FRANKENSTEIN
OR, THE MODERN PROMETHEUS

by Mary Wollstonecraft Shelley

CHAPTER I

It was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet. It was already one in the morning; the rain pattered dismally against the panes, and my candle was nearly burnt out, when, by the glimmer of the half-extinguished light, I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs.

How can I describe my emotions at this catastrophe, or how delineate the wretch whom with such infinite pains and care I had endeavoured to form? His limbs were in proportion, and I had selected his features as beautiful. Beautiful! Great God! His yellow skin scarcely covered the work of muscles and arteries beneath; his hair was of a lustrous black, and flowing; his teeth of a pearly whiteness; but these luxuriances only formed a more horrid contrast with his watery eyes, that seemed almost of the same colour as the dun-white sockets in which they were set, his shrivelled complexion and straight black lips.

Victor Frankenstein created a monster that would haunt him forever. The creature, abandoned by its creator, seeks revenge against Victor and those he loves. This tale explores themes of scientific responsibility, the nature of humanity, and the consequences of playing God. The monster learns to speak and read, becoming articulate in its demands for companionship. When Victor refuses to create a mate for the creature, it murders Victor's brother William, frames the innocent Justine, and later kills Victor's best friend Clerval and bride Elizabeth. In the end, both creator and creature are destroyed by their obsession with each other. Victor dies pursuing the monster to the Arctic, and the creature, having achieved its revenge, disappears into the wilderness, promising to destroy itself.

Characters include Victor Frankenstein, the ambitious scientist; the Monster, his abandoned creation; Elizabeth Lavenza, Victor's adopted sister and fiancée; Alphonse Frankenstein, Victor's father; William Frankenstein, Victor's younger brother; Justine Moritz, the Frankenstein family servant; Robert Walton, the Arctic explorer who tells the story; Henry Clerval, Victor's best friend; and De Lacey, the blind man who shows kindness to the Monster.

"Beware; for I am fearless, and therefore powerful." - The Monster`,
                wordCount: 342
            },
            '1342': {
                title: 'Pride and Prejudice',
                author: 'Jane Austen',
                text: `PRIDE AND PREJUDICE

by Jane Austen

CHAPTER I

It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.

However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.

"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?"

Mr. Bennet replied that he had not.

"But it is," returned she; "for Mrs. Long has just been here, and she told me all about it."

Mr. Bennet made no answer.

"Do you not want to know who has taken it?" cried his wife impatiently.

"You want to tell me, and I have no objection to hearing it."

Elizabeth Bennet must navigate the complex world of 19th century English society, where marriage and social status are paramount. She encounters the proud and wealthy Mr. Darcy, initially disliking his arrogant demeanor. Through misunderstandings involving the charming but deceptive Wickham, and the interference of the proud Lady Catherine de Bourgh, Elizabeth and Darcy must overcome their initial prejudices to find true love.

The novel explores themes of class, marriage, and personal growth as Elizabeth learns not to judge by first impressions, and Darcy learns to be more humble and considerate. Other characters include Elizabeth's gentle sister Jane and her love interest Mr. Bingley, the foolish Mr. Collins, and Elizabeth's flighty younger sisters Lydia and Kitty.

Characters include Elizabeth Bennet, the intelligent heroine; Mr. Fitzwilliam Darcy, the proud wealthy gentleman; Jane Bennet, Elizabeth's gentle sister; Mr. Charles Bingley, Jane's love interest; Mr. Bennet, the witty father; Mrs. Bennet, the marriage-obsessed mother; Mr. Wickham, the charming soldier; Lady Catherine de Bourgh, Darcy's imperious aunt; Mr. Collins, the ridiculous clergyman; and Charlotte Lucas, Elizabeth's practical friend.

"I could easily forgive his pride, if he had not mortified mine." - Elizabeth Bennet`,
                wordCount: 298
            },
            '2701': {
                title: 'Moby Dick; Or, The Whale',
                author: 'Herman Melville',
                text: `MOBY DICK
OR, THE WHALE

by Herman Melville

CHAPTER 1. Loomings.

Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation.

Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people's hats off—then, I account it high time to get to sea as soon as possible.

Captain Ahab commands the Pequod in his monomaniacal quest to kill the white whale that took his leg. Ishmael befriends the harpooner Queequeg, and together they join the crew of this doomed voyage. The novel explores themes of obsession, fate, and man's relationship with nature. Ahab's pursuit of Moby Dick becomes a metaphor for the human condition and the futility of revenge against the natural world.

Characters include Ishmael, the narrator and sailor; Captain Ahab, the obsessed captain; Queequeg, the noble harpooner; Starbuck, the first mate; Stubb, the second mate; Flask, the third mate; Fedallah, Ahab's mysterious harpooner; Tashtego, Stubb's harpooner; Daggoo, Flask's harpooner; and Moby Dick, the legendary white whale.

"From hell's heart I stab at thee; for hate's sake I spit my last breath at thee." - Captain Ahab`,
                wordCount: 267
            }
        };
        const mockBook = mockBooks[id];
        if (mockBook) {
            console.log(`✅ [tryMockData] Found mock data for book ${id}: "${mockBook.title}"`);
            return mockBook;
        }
        console.log(`❌ [tryMockData] No mock data available for book ${id}`);
        return null;
    }
    /**
     * Generate all possible Gutenberg URL patterns for a book ID
     */
    static generateAllPossibleUrls(id) {
        return [
            // Cache/epub formats (most common for newer books)
            `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
            `https://www.gutenberg.org/cache/epub/${id}/pg${id}-0.txt`,
            `https://www.gutenberg.org/cache/epub/${id}/pg${id}-8.txt`,
            // Files format (common for older books)
            `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
            `https://www.gutenberg.org/files/${id}/${id}.txt`,
            `https://www.gutenberg.org/files/${id}/${id}-8.txt`,
            // Ebooks format
            `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`,
            // HTTP fallbacks (in case HTTPS is blocked)
            `http://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
            `http://www.gutenberg.org/files/${id}/${id}-0.txt`,
            `http://www.gutenberg.org/files/${id}/${id}.txt`
        ];
    }
    /**
     * Try a single URL with retry logic and text truncation
     */
    static async tryUrlWithRetries(url, id, triedUrls, maxRetries = 2) {
        triedUrls.push(url);
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 [tryUrlWithRetries] Attempt ${attempt}/${maxRetries} for ${url}`);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    console.log(`⏱️ [tryUrlWithRetries] Timeout (20s) for ${url}`);
                    controller.abort();
                }, 20000); // 20 second timeout for faster response
                const startTime = Date.now();
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'GutenbergCharacters/1.0',
                        'Accept': 'text/plain,text/*,*/*'
                    }
                });
                const duration = Date.now() - startTime;
                clearTimeout(timeoutId);
                console.log(`📊 [tryUrlWithRetries] Response ${response.status} in ${duration}ms for ${url}`);
                if (response.ok) {
                    // Stream the text and truncate early for faster processing
                    const reader = response.body?.getReader();
                    if (!reader) {
                        console.log(`❌ [tryUrlWithRetries] No readable stream for ${url}`);
                        continue;
                    }
                    let text = '';
                    let decoder = new TextDecoder();
                    // Read chunks until we have enough text or reach the end
                    while (text.length < this.MAX_TEXT_LENGTH * 2) { // Read a bit more to ensure we get enough
                        const { done, value } = await reader.read();
                        if (done)
                            break;
                        text += decoder.decode(value, { stream: true });
                    }
                    // Cancel the stream to save bandwidth
                    reader.cancel();
                    console.log(`📝 [tryUrlWithRetries] Streamed ${text.length} characters from ${url}`);
                    if (text.length > 100) { // Ensure we got actual content
                        // Truncate to manageable size for faster processing
                        const truncatedText = text.substring(0, this.MAX_TEXT_LENGTH);
                        const metadata = this.extractMetadataFromText(truncatedText);
                        const cleanedText = this.cleanGutenbergText(truncatedText);
                        const wordCount = this.countWords(cleanedText);
                        console.log(`✂️ [tryUrlWithRetries] Truncated to ${cleanedText.length} characters for processing`);
                        return {
                            text: cleanedText,
                            title: metadata.title || `Book ${id}`,
                            author: metadata.author || 'Unknown Author',
                            wordCount
                        };
                    }
                    else {
                        console.log(`⚠️ [tryUrlWithRetries] Text too short (${text.length} chars) from ${url}`);
                    }
                }
                else {
                    console.log(`❌ [tryUrlWithRetries] HTTP ${response.status} for ${url}`);
                }
            }
            catch (error) {
                console.log(`💥 [tryUrlWithRetries] Attempt ${attempt} failed for ${url}:`, error instanceof Error ? error.message : 'Unknown error');
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    console.log(`⏳ [tryUrlWithRetries] Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        console.log(`❌ [tryUrlWithRetries] All ${maxRetries} attempts failed for ${url}`);
        return null;
    }
    /**
     * Find a working text URL by trying multiple formats
     */
    static async findWorkingTextUrl(formats, id, triedUrls) {
        // Strategy 1: Try URLs from the API metadata first
        const urlsFromApi = this.extractTextUrlsFromFormats(formats);
        for (const url of urlsFromApi) {
            if (await this.testUrl(url, triedUrls)) {
                return url;
            }
        }
        // Strategy 2: Try common Gutenberg URL patterns
        const fallbackUrls = this.generateAllPossibleUrls(id);
        for (const url of fallbackUrls) {
            if (await this.testUrl(url, triedUrls)) {
                return url;
            }
        }
        return null;
    }
    /**
     * Extract text URLs from API format data
     */
    static extractTextUrlsFromFormats(formats) {
        const urls = [];
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
                urls.push(formats[mimeType]);
            }
        }
        // Then look for .txt files in the formats object
        for (const [, url] of Object.entries(formats)) {
            if (url.includes('.txt') && !urls.includes(url)) {
                urls.push(url);
            }
        }
        return urls;
    }
    /**
     * Test if a URL returns valid content
     */
    static async testUrl(url, triedUrls) {
        triedUrls.push(url);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(url, {
                method: 'HEAD', // Use HEAD to check without downloading
                signal: controller.signal,
                headers: {
                    'User-Agent': 'GutenbergCharacters/1.0'
                }
            });
            clearTimeout(timeoutId);
            return response.ok;
        }
        catch (error) {
            console.log(`URL test failed for ${url}:`, error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
    /**
     * Extract title and author from Project Gutenberg text headers
     */
    static extractMetadataFromText(text) {
        const metadata = {};
        // Look for title patterns in the first 2000 characters
        const header = text.substring(0, 2000);
        // Common title patterns
        const titlePatterns = [
            /^(.+?)\s*\n\s*\n/m, // First line as title
            /^(.+?)\s*\n\s*by\s+/im, // Title followed by "by"
            /Title:\s*(.+?)(?:\n|$)/im,
            /^(.+?)\s*;\s*\n/m // Title ending with semicolon
        ];
        for (const pattern of titlePatterns) {
            const match = header.match(pattern);
            if (match && match[1]) {
                const title = match[1].trim();
                if (title.length > 5 && title.length < 200 && !title.includes('Project Gutenberg')) {
                    metadata.title = title;
                    break;
                }
            }
        }
        // Common author patterns
        const authorPatterns = [
            /by\s+(.+?)(?:\n|\s{2,})/im,
            /Author:\s*(.+?)(?:\n|$)/im,
            /\n(.+?)\s*\n\s*\n/m // Second line as author
        ];
        for (const pattern of authorPatterns) {
            const match = header.match(pattern);
            if (match && match[1]) {
                const author = match[1].trim();
                if (author.length > 3 && author.length < 100 && !author.includes('Project Gutenberg')) {
                    metadata.author = author;
                    break;
                }
            }
        }
        return metadata;
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
GutenbergService.BASE_URL = 'https://gutendx.com/books';
GutenbergService.FALLBACK_BASE_URL = 'https://www.gutenberg.org';
GutenbergService.MAX_TEXT_LENGTH = 8000; // Process only first 8k characters
//# sourceMappingURL=gutenberg.js.map