export interface ChapterTopic {
  chapterNumber: number
  chapterTitle?: string
  topTerms: TopicTerm[]
  summary: string
  themes: string[]
  wordCount: number
  uniqueWords: number
}

export interface TopicTerm {
  term: string
  tfIdf: number
  frequency: number
  significance: number
  category?: string
}

export interface TopicAnalysisOptions {
  maxTermsPerChapter?: number
  minTermLength?: number
  includeNgrams?: boolean
  customStopwords?: string[]
}

/**
 * Comprehensive stopwords list for English
 */
const STOPWORDS = new Set([
  // Common English stopwords
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it',
  'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with', 'would', 'had', 'have', 'his',
  'her', 'she', 'they', 'them', 'their', 'this', 'these', 'those', 'there', 'where', 'when',
  'what', 'who', 'which', 'why', 'how', 'but', 'or', 'if', 'then', 'than', 'so', 'very', 'can',
  'could', 'should', 'would', 'may', 'might', 'must', 'shall', 'will', 'do', 'did', 'does',
  'done', 'doing', 'get', 'got', 'getting', 'go', 'going', 'gone', 'went', 'come', 'came',
  'coming', 'see', 'saw', 'seen', 'seeing', 'look', 'looked', 'looking', 'take', 'took', 'taken',
  'taking', 'make', 'made', 'making', 'give', 'gave', 'given', 'giving', 'put', 'putting',
  
  // Literary stopwords
  'said', 'say', 'says', 'saying', 'tell', 'told', 'telling', 'ask', 'asked', 'asking',
  'reply', 'replied', 'replying', 'answer', 'answered', 'answering', 'speak', 'spoke', 'spoken',
  'speaking', 'talk', 'talked', 'talking', 'call', 'called', 'calling', 'cry', 'cried', 'crying',
  'laugh', 'laughed', 'laughing', 'smile', 'smiled', 'smiling', 'think', 'thought', 'thinking',
  'know', 'knew', 'known', 'knowing', 'feel', 'felt', 'feeling', 'seem', 'seemed', 'seeming',
  'appear', 'appeared', 'appearing', 'become', 'became', 'becoming', 'remain', 'remained',
  'remaining', 'stay', 'stayed', 'staying', 'keep', 'kept', 'keeping', 'left', 'leave', 'leaving',
  'turn', 'turned', 'turning', 'move', 'moved', 'moving', 'walk', 'walked', 'walking', 'run',
  'ran', 'running', 'sit', 'sat', 'sitting', 'stand', 'stood', 'standing', 'lie', 'lay', 'lying',
  
  // Time and place
  'now', 'then', 'here', 'there', 'today', 'yesterday', 'tomorrow', 'morning', 'afternoon',
  'evening', 'night', 'day', 'week', 'month', 'year', 'time', 'moment', 'while', 'during',
  'before', 'after', 'since', 'until', 'up', 'down', 'over', 'under', 'above', 'below',
  'between', 'among', 'through', 'around', 'near', 'far', 'close', 'away', 'back', 'forward',
  
  // Quantities and determiners
  'one', 'two', 'three', 'first', 'second', 'last', 'next', 'another', 'other', 'some', 'any',
  'many', 'much', 'more', 'most', 'few', 'little', 'less', 'least', 'all', 'every', 'each',
  'both', 'either', 'neither', 'no', 'none', 'nothing', 'something', 'anything', 'everything',
  'someone', 'anyone', 'everyone', 'nobody', 'anybody', 'everybody'
])

/**
 * Thematic categories for topic classification
 */
const THEME_CATEGORIES: Record<string, string[]> = {
  'Love & Romance': [
    'love', 'romance', 'marriage', 'wedding', 'bride', 'groom', 'husband', 'wife',
    'courtship', 'affection', 'passion', 'desire', 'heart', 'kiss', 'embrace',
    'beloved', 'darling', 'sweetheart', 'dear', 'cherish', 'adore'
  ],
  'Death & Mortality': [
    'death', 'die', 'dead', 'dying', 'kill', 'murder', 'grave', 'cemetery',
    'funeral', 'burial', 'corpse', 'ghost', 'spirit', 'soul', 'afterlife',
    'mourn', 'grief', 'sorrow', 'loss', 'tragedy', 'fatal', 'mortal'
  ],
  'War & Conflict': [
    'war', 'battle', 'fight', 'combat', 'conflict', 'soldier', 'army', 'military',
    'weapon', 'sword', 'gun', 'victory', 'defeat', 'enemy', 'ally', 'siege',
    'rebellion', 'revolution', 'peace', 'truce', 'surrender', 'conquer'
  ],
  'Family & Relationships': [
    'family', 'mother', 'father', 'parents', 'son', 'daughter', 'child', 'children',
    'brother', 'sister', 'sibling', 'cousin', 'uncle', 'aunt', 'grandfather',
    'grandmother', 'relative', 'kinship', 'bloodline', 'heritage', 'lineage'
  ],
  'Social Class & Status': [
    'noble', 'nobility', 'aristocrat', 'lord', 'lady', 'duke', 'duchess', 'earl',
    'baron', 'servant', 'peasant', 'commoner', 'wealth', 'poor', 'rich', 'poverty',
    'fortune', 'inheritance', 'estate', 'manor', 'castle', 'palace', 'throne'
  ],
  'Religion & Spirituality': [
    'god', 'divine', 'holy', 'sacred', 'prayer', 'church', 'cathedral', 'chapel',
    'priest', 'minister', 'faith', 'belief', 'heaven', 'hell', 'sin', 'virtue',
    'blessing', 'curse', 'miracle', 'salvation', 'redemption', 'angel', 'devil'
  ],
  'Nature & Environment': [
    'nature', 'forest', 'tree', 'mountain', 'river', 'sea', 'ocean', 'sky',
    'sun', 'moon', 'star', 'wind', 'storm', 'rain', 'snow', 'flower',
    'garden', 'field', 'meadow', 'valley', 'hill', 'landscape', 'countryside'
  ],
  'Emotions & Psychology': [
    'emotion', 'feeling', 'mood', 'temperament', 'joy', 'happiness', 'sadness',
    'anger', 'fear', 'anxiety', 'worry', 'hope', 'despair', 'pride', 'shame',
    'guilt', 'jealousy', 'envy', 'hatred', 'forgiveness', 'mercy', 'compassion'
  ]
}

/**
 * TF-IDF Topic Analysis for chapters
 */
export class TopicAnalyzer {
  private stopwords: Set<string>
  
  constructor(customStopwords: string[] = []) {
    this.stopwords = new Set([...STOPWORDS, ...customStopwords])
  }

  /**
   * Analyze topics for all chapters in text
   */
  analyzeChapterTopics(
    text: string,
    options: TopicAnalysisOptions = {}
  ): ChapterTopic[] {
    const {
      maxTermsPerChapter = 5,
      minTermLength = 3,
      includeNgrams = false,
      customStopwords = []
    } = options

    // Add custom stopwords
    customStopwords.forEach(word => this.stopwords.add(word.toLowerCase()))

    // Split text into chapters
    const chapters = this.splitIntoChapters(text)
    if (chapters.length === 0) return []

    // Process each chapter
    const documents = chapters.map(chapter => this.preprocessText(chapter.text, minTermLength))
    
    // Calculate TF-IDF for all documents
    const tfIdfMatrix = this.calculateTfIdf(documents, includeNgrams)
    
    // Analyze each chapter
    return chapters.map((chapter, index) => {
      const terms = tfIdfMatrix[index]
      const topTerms = this.getTopTerms(terms, maxTermsPerChapter)
      const themes = this.identifyThemes(topTerms)
      const summary = this.generateSummary(topTerms, themes)

      return {
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        topTerms,
        summary,
        themes,
        wordCount: chapter.text.split(/\s+/).length,
        uniqueWords: new Set(this.tokenize(chapter.text)).size
      }
    })
  }

  /**
   * Split text into chapters
   */
  private splitIntoChapters(text: string): Array<{
    number: number
    title?: string
    text: string
  }> {
    // Common chapter patterns in literature
    const chapterPatterns = [
      /^CHAPTER\s+([IVXLCDM\d]+)\.?\s*(.*?)$/gm,
      /^Chapter\s+(\d+)\.?\s*(.*?)$/gm,
      /^([IVXLCDM]+)\.?\s*$/gm,
      /^(\d+)\.?\s*$/gm
    ]

    let chapters: Array<{ number: number; title?: string; text: string }> = []
    let bestSplit: Array<{ start: number; number: number; title?: string }> = []

    // Try each pattern and use the one that finds the most chapters
    for (const pattern of chapterPatterns) {
      const matches: Array<{ start: number; number: number; title?: string }> = []
      let match

      while ((match = pattern.exec(text)) !== null) {
        const numberStr = match[1]
        const title = match[2]?.trim()
        
        let number: number
        if (/^\d+$/.test(numberStr)) {
          number = parseInt(numberStr)
        } else {
          // Roman numeral conversion (simplified)
          number = this.romanToNumber(numberStr) || matches.length + 1
        }

        matches.push({
          start: match.index,
          number,
          title: title || undefined
        })
      }

      if (matches.length > bestSplit.length) {
        bestSplit = matches
      }
    }

    // If no clear chapters found, create artificial chapters
    if (bestSplit.length < 2) {
      const chapterLength = Math.floor(text.length / 10) // ~10 chapters
      for (let i = 0; i < 10; i++) {
        const start = i * chapterLength
        const end = Math.min((i + 1) * chapterLength, text.length)
        chapters.push({
          number: i + 1,
          text: text.substring(start, end)
        })
      }
    } else {
      // Extract chapter texts
      for (let i = 0; i < bestSplit.length; i++) {
        const start = bestSplit[i].start
        const end = i < bestSplit.length - 1 ? bestSplit[i + 1].start : text.length
        
        chapters.push({
          number: bestSplit[i].number,
          title: bestSplit[i].title,
          text: text.substring(start, end)
        })
      }
    }

    return chapters.filter(chapter => chapter.text.trim().length > 100)
  }

  /**
   * Preprocess text for analysis
   */
  private preprocessText(text: string, minLength: number): string[] {
    return this.tokenize(text)
      .filter(word => 
        word.length >= minLength && 
        !this.stopwords.has(word) &&
        /^[a-zA-Z]+$/.test(word) // Only alphabetic words
      )
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0)
  }

  /**
   * Calculate TF-IDF matrix for all documents
   */
  private calculateTfIdf(documents: string[][], includeNgrams: boolean): TopicTerm[][] {
    // Build vocabulary
    const vocabulary = new Set<string>()
    const termFrequencies: Record<string, number>[] = []

    documents.forEach(doc => {
      const termFreq: Record<string, number> = {}
      
      // Unigrams
      doc.forEach(term => {
        vocabulary.add(term)
        termFreq[term] = (termFreq[term] || 0) + 1
      })

      // Bigrams if requested
      if (includeNgrams) {
        for (let i = 0; i < doc.length - 1; i++) {
          const bigram = `${doc[i]} ${doc[i + 1]}`
          vocabulary.add(bigram)
          termFreq[bigram] = (termFreq[bigram] || 0) + 1
        }
      }

      termFrequencies.push(termFreq)
    })

    // Calculate document frequencies
    const documentFrequencies: Record<string, number> = {}
    vocabulary.forEach(term => {
      documentFrequencies[term] = documents.filter(doc => 
        termFrequencies[documents.indexOf(doc)][term] > 0
      ).length
    })

    // Calculate TF-IDF for each document
    return documents.map((doc, docIndex) => {
      const terms: TopicTerm[] = []
      const termFreq = termFrequencies[docIndex]
      const totalTerms = Object.values(termFreq).reduce((sum, freq) => sum + freq, 0)

      Object.entries(termFreq).forEach(([term, freq]) => {
        const tf = freq / totalTerms
        const df = documentFrequencies[term]
        const idf = Math.log(documents.length / df)
        const tfIdf = tf * idf

        terms.push({
          term,
          tfIdf,
          frequency: freq,
          significance: this.calculateSignificance(term, tfIdf, freq),
          category: this.categorizeTheme(term)
        })
      })

      return terms.sort((a, b) => b.tfIdf - a.tfIdf)
    })
  }

  /**
   * Get top terms for a chapter
   */
  private getTopTerms(terms: TopicTerm[], maxTerms: number): TopicTerm[] {
    return terms
      .filter(term => term.tfIdf > 0)
      .slice(0, maxTerms)
  }

  /**
   * Identify themes based on top terms
   */
  private identifyThemes(topTerms: TopicTerm[]): string[] {
    const themeScores: Record<string, number> = {}

    Object.entries(THEME_CATEGORIES).forEach(([theme, keywords]) => {
      let score = 0
      topTerms.forEach(term => {
        if (keywords.some(keyword => 
          term.term.includes(keyword) || keyword.includes(term.term)
        )) {
          score += term.significance
        }
      })
      themeScores[theme] = score
    })

    return Object.entries(themeScores)
      .filter(([_, score]) => score > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3)
      .map(([theme]) => theme)
  }

  /**
   * Generate chapter summary from top terms
   */
  private generateSummary(topTerms: TopicTerm[], themes: string[]): string {
    if (topTerms.length === 0) return 'No significant topics identified.'

    const termList = topTerms.slice(0, 3).map(term => term.term).join(', ')
    const themeList = themes.length > 0 ? themes.join(', ') : 'general narrative'

    return `Key terms: ${termList}. Primary themes: ${themeList}.`
  }

  /**
   * Calculate significance score for a term
   */
  private calculateSignificance(term: string, tfIdf: number, frequency: number): number {
    let significance = tfIdf

    // Boost significance for longer terms (they're often more specific)
    if (term.length > 6) significance *= 1.2
    
    // Boost significance for compound terms (likely more meaningful)
    if (term.includes(' ')) significance *= 1.3

    // Boost significance for terms that appear in theme categories
    const isThematic = Object.values(THEME_CATEGORIES).some(keywords =>
      keywords.includes(term) || keywords.some(keyword => 
        term.includes(keyword) || keyword.includes(term)
      )
    )
    if (isThematic) significance *= 1.5

    return significance
  }

  /**
   * Categorize a term into thematic categories
   */
  private categorizeTheme(term: string): string | undefined {
    for (const [theme, keywords] of Object.entries(THEME_CATEGORIES)) {
      if (keywords.includes(term) || keywords.some(keyword => 
        term.includes(keyword) || keyword.includes(term)
      )) {
        return theme
      }
    }
    return undefined
  }

  /**
   * Convert Roman numerals to numbers (simplified)
   */
  private romanToNumber(roman: string): number | null {
    const romanNumerals: Record<string, number> = {
      'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
      'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15, 'XVI': 16, 'XVII': 17, 'XVIII': 18, 'XIX': 19, 'XX': 20
    }
    return romanNumerals[roman.toUpperCase()] || null
  }

  /**
   * Get topic trends across chapters
   */
  static getTopicTrends(chapterTopics: ChapterTopic[]): Record<string, number[]> {
    const allTerms = new Set<string>()
    chapterTopics.forEach(chapter => {
      chapter.topTerms.forEach(term => allTerms.add(term.term))
    })

    const trends: Record<string, number[]> = {}
    allTerms.forEach(term => {
      trends[term] = chapterTopics.map(chapter => {
        const foundTerm = chapter.topTerms.find(t => t.term === term)
        return foundTerm ? foundTerm.tfIdf : 0
      })
    })

    return trends
  }

  /**
   * Export topics to CSV
   */
  static exportTopicsCSV(chapterTopics: ChapterTopic[]): string {
    const headers = ['Chapter', 'Title', 'Top Terms', 'Themes', 'Summary', 'Word Count']
    
    const rows = chapterTopics.map(chapter => [
      chapter.chapterNumber.toString(),
      chapter.chapterTitle || '',
      chapter.topTerms.map(t => `${t.term}(${t.tfIdf.toFixed(3)})`).join('; '),
      chapter.themes.join('; '),
      chapter.summary,
      chapter.wordCount.toString()
    ])

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
  }
}
