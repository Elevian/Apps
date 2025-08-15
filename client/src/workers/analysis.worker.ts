import { expose } from 'comlink'
import { 
  computeCooccurrence, 
  filterGraphData, 
  getGraphStats,
  type CooccurrenceOptions,
  type GraphData 
} from '../lib/graph/co-occurrence'
import {
  extractAndAnalyzeQuotes,
  analyzeChapterMentions,
  calculateCharacterRankings,
  type AnalyzedQuote,
  type ChapterMention,
  type CharacterRanking
} from '../lib/insights/sentiment-analysis'
import { Character } from '../lib/api/schemas'
import { CharacterExtractor, type ExtractedCharacter, type CharacterExtractionOptions } from '../lib/analysis/character-extraction'
import { NetworkMetricsCalculator, type NetworkMetrics, type NetworkStats } from '../lib/analysis/network-metrics'
import { EnhancedSentimentAnalyzer, type EnhancedQuote, type SentimentOptions } from '../lib/analysis/enhanced-sentiment'
import { TopicAnalyzer, type ChapterTopic, type TopicAnalysisOptions } from '../lib/analysis/topic-analysis'

export interface AnalysisProgress {
  step: 'splitting' | 'parsing' | 'cooccurrence' | 'sentiment' | 'ranking' | 'complete'
  progress: number
  message: string
  data?: any
}

export interface ChapterSplitResult {
  chapters: string[]
  sentences: string[]
  totalWords: number
  totalCharacters: number
}

export interface AnalysisResult {
  graphData: GraphData
  quotes: AnalyzedQuote[]
  rankings: CharacterRanking[]
  chapterMentions: Map<string, ChapterMention[]>
  
  // Enhanced features
  extractedCharacters: ExtractedCharacter[]
  networkMetrics: NetworkMetrics[]
  networkStats: NetworkStats
  enhancedQuotes: EnhancedQuote[]
  chapterTopics: ChapterTopic[]
  
  stats: {
    processingTime: number
    textLength: number
    chaptersCount: number
    sentencesCount: number
    extractionMethod: string
    metricsCalculated: number
  }
}

class AnalysisWorker {
  private abortController: AbortController | null = null

  /**
   * Split text into chapters and sentences with progress reporting
   */
  async splitTextIntoChapters(
    text: string,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<ChapterSplitResult> {
    this.abortController = new AbortController()
    
    try {
      onProgress?.({
        step: 'splitting',
        progress: 10,
        message: 'Detecting chapter boundaries...'
      })

      this.checkAborted()

      // Detect chapter breaks (common patterns in Project Gutenberg)
      const chapterPatterns = [
        /^CHAPTER\s+[IVXLCDM\d]+/gmi,
        /^Chapter\s+\d+/gmi,
        /^[IVXLCDM]+\.\s/gmi,
        /^\d+\.\s/gmi
      ]

      let chapters: string[] = []
      let bestPattern: RegExp | null = null
      let maxChapters = 0

      // Try each pattern and use the one that finds the most chapters
      for (const pattern of chapterPatterns) {
        const matches = text.split(pattern)
        if (matches.length > maxChapters) {
          maxChapters = matches.length
          bestPattern = pattern
          chapters = matches.filter(chapter => chapter.trim().length > 100)
        }
      }

      this.checkAborted()

      onProgress?.({
        step: 'splitting',
        progress: 40,
        message: `Found ${chapters.length} chapters, splitting sentences...`
      })

      // If no clear chapters found, split by approximate length
      if (chapters.length < 3) {
        const chapterLength = Math.floor(text.length / 15) // ~15 chapters
        chapters = []
        for (let i = 0; i < text.length; i += chapterLength) {
          chapters.push(text.substring(i, i + chapterLength))
        }
      }

      this.checkAborted()

      onProgress?.({
        step: 'splitting',
        progress: 70,
        message: 'Extracting sentences...'
      })

      // Split into sentences with progress
      const sentences: string[] = []
      const sentencePattern = /[.!?]+\s+/g
      
      for (let i = 0; i < chapters.length; i++) {
        this.checkAborted()
        
        const chapterSentences = chapters[i]
          .split(sentencePattern)
          .map(s => s.trim())
          .filter(s => s.length > 10)
        
        sentences.push(...chapterSentences)
        
        onProgress?.({
          step: 'splitting',
          progress: 70 + (i / chapters.length) * 20,
          message: `Processing chapter ${i + 1}/${chapters.length}...`
        })
      }

      onProgress?.({
        step: 'splitting',
        progress: 100,
        message: `Split complete: ${chapters.length} chapters, ${sentences.length} sentences`
      })

      return {
        chapters,
        sentences,
        totalWords: text.split(/\s+/).length,
        totalCharacters: text.length
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Analysis was cancelled')
      }
      throw error
    }
  }

  /**
   * Perform complete enhanced analysis with progress reporting
   */
  async analyzeText(
    text: string,
    inputCharacters: Character[],
    options: CooccurrenceOptions & CharacterExtractionOptions & SentimentOptions & TopicAnalysisOptions = { 
      windowSize: 3, 
      minEdgeWeight: 2, 
      minMentions: 2,
      useOllama: true,
      maxCharacters: 20,
      includeNegation: true,
      maxTermsPerChapter: 5
    },
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<AnalysisResult> {
    const startTime = Date.now()
    this.abortController = new AbortController()

    try {
      // Step 1: Enhanced Character Extraction
      onProgress?.({
        step: 'parsing',
        progress: 5,
        message: 'Extracting characters with LLM + NLP...'
      })

      const characterExtractor = new CharacterExtractor()
      const extractedCharacters = await characterExtractor.extractCharacters(text, options)
      
      // Use extracted characters or fallback to input
      const characters = extractedCharacters.length > 0 
        ? CharacterExtractor.toApiFormat(extractedCharacters)
        : inputCharacters

      this.checkAborted()

      // Step 2: Text parsing
      onProgress?.({
        step: 'parsing',
        progress: 15,
        message: 'Parsing text structure...'
      })

      const splitResult = await this.splitTextIntoChapters(text, (progress) => {
        onProgress?.({
          ...progress,
          progress: 15 + progress.progress * 0.15 // 15-30%
        })
      })

      this.checkAborted()

      // Step 3: Co-occurrence analysis
      onProgress?.({
        step: 'cooccurrence',
        progress: 30,
        message: 'Analyzing character relationships...'
      })

      const graphData = await this.computeCooccurrenceWithProgress(
        text, 
        characters, 
        options,
        (progress) => {
          onProgress?.({
            step: 'cooccurrence',
            progress: 30 + progress * 0.2, // 30-50%
            message: 'Building character network...'
          })
        }
      )

      this.checkAborted()

      // Step 4: Network Metrics Calculation
      onProgress?.({
        step: 'cooccurrence',
        progress: 50,
        message: 'Calculating network metrics...'
      })

      const metricsCalculator = new NetworkMetricsCalculator()
      const { nodeMetrics, networkStats } = metricsCalculator.calculateMetrics(graphData)

      this.checkAborted()

      // Step 5: Enhanced Sentiment Analysis
      onProgress?.({
        step: 'sentiment',
        progress: 60,
        message: 'Enhanced quote extraction and sentiment analysis...'
      })

      const sentimentAnalyzer = new EnhancedSentimentAnalyzer()
      const enhancedQuotes = sentimentAnalyzer.extractAndAnalyzeQuotes(text, characters, 25, options)

      // Legacy quotes for compatibility
      const quotes = await this.extractQuotesWithProgress(
        text,
        characters,
        (progress) => {
          onProgress?.({
            step: 'sentiment',
            progress: 60 + progress * 0.15, // 60-75%
            message: 'Processing legacy sentiment...'
          })
        }
      )

      this.checkAborted()

      // Step 6: Topic Analysis
      onProgress?.({
        step: 'sentiment',
        progress: 75,
        message: 'Analyzing chapter topics with TF-IDF...'
      })

      const topicAnalyzer = new TopicAnalyzer()
      const chapterTopics = topicAnalyzer.analyzeChapterTopics(text, options)

      this.checkAborted()

      // Step 7: Character rankings with enhanced metrics
      onProgress?.({
        step: 'ranking',
        progress: 85,
        message: 'Calculating character importance...'
      })

      const rankings = calculateCharacterRankings(characters, graphData)

      // Step 8: Chapter mentions for top characters
      const chapterMentions = new Map<string, ChapterMention[]>()
      const topCharacters = rankings.slice(0, 3)
      
      for (let i = 0; i < topCharacters.length; i++) {
        this.checkAborted()
        
        const character = topCharacters[i].character
        const mentions = analyzeChapterMentions(text, character, splitResult.chapters.length)
        chapterMentions.set(character.name, mentions)
        
        onProgress?.({
          step: 'ranking',
          progress: 85 + ((i + 1) / topCharacters.length) * 10,
          message: `Analyzing ${character.name} chapter mentions...`
        })
      }

      onProgress?.({
        step: 'complete',
        progress: 100,
        message: 'Enhanced analysis complete!'
      })

      return {
        graphData,
        quotes,
        rankings,
        chapterMentions,
        
        // Enhanced features
        extractedCharacters,
        networkMetrics: nodeMetrics,
        networkStats,
        enhancedQuotes,
        chapterTopics,
        
        stats: {
          processingTime: Date.now() - startTime,
          textLength: text.length,
          chaptersCount: splitResult.chapters.length,
          sentencesCount: splitResult.sentences.length,
          extractionMethod: extractedCharacters.length > 0 ? extractedCharacters[0].extractionMethod : 'manual',
          metricsCalculated: nodeMetrics.length
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Analysis was cancelled')
      }
      throw error
    }
  }

  /**
   * Cancel current analysis
   */
  cancelAnalysis(): void {
    if (this.abortController) {
      this.abortController.abort()
    }
  }

  private checkAborted(): void {
    if (this.abortController?.signal.aborted) {
      throw new Error('Analysis was cancelled')
    }
  }

  private async computeCooccurrenceWithProgress(
    text: string,
    characters: Character[],
    options: CooccurrenceOptions,
    onProgress?: (progress: number) => void
  ): Promise<GraphData> {
    // Simulate progress for co-occurrence computation
    onProgress?.(0.1)
    
    this.checkAborted()
    
    // Split into manageable chunks for progress reporting
    const result = computeCooccurrence(text, characters, options)
    
    onProgress?.(0.5)
    this.checkAborted()
    
    // Filter and optimize
    const filtered = filterGraphData(result, options)
    
    onProgress?.(1.0)
    
    return filtered
  }

  private async extractQuotesWithProgress(
    text: string,
    characters: Character[],
    onProgress?: (progress: number) => void
  ): Promise<AnalyzedQuote[]> {
    onProgress?.(0.1)
    this.checkAborted()
    
    // Extract quotes in chunks to allow progress reporting
    const quotes = extractAndAnalyzeQuotes(text, characters, 10)
    
    onProgress?.(0.7)
    this.checkAborted()
    
    // Sort and finalize
    const sortedQuotes = quotes.sort((a, b) => Math.abs(b.sentimentScore) - Math.abs(a.sentimentScore))
    
    onProgress?.(1.0)
    
    return sortedQuotes
  }
}

// Expose worker API
const analysisWorker = new AnalysisWorker()
expose(analysisWorker)
