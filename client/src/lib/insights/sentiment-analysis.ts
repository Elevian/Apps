import Sentiment from 'sentiment'
import { Character } from '@/lib/api/schemas'

export interface AnalyzedQuote {
  text: string
  character: string | null
  sentimentScore: number
  sentimentLabel: 'very positive' | 'positive' | 'neutral' | 'negative' | 'very negative'
  confidence: number
  words: string[]
  context: string
}

export interface ChapterMention {
  chapter: number
  mentions: number
}

export interface CharacterRanking {
  character: Character
  rank: number
  mentions: number
  weightedDegree: number
  networkImportance: number
}

const sentiment = new Sentiment()

/**
 * Extract quotes from text and analyze sentiment using AFINN
 */
export function extractAndAnalyzeQuotes(
  text: string,
  characters: Character[],
  maxQuotes: number = 10
): AnalyzedQuote[] {
  // Find dialogue and notable sentences
  const quotes: AnalyzedQuote[] = []
  
  // Split text into sentences
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200) // Filter for meaningful length
  
  // Look for dialogue (quoted text)
  const dialoguePattern = /"([^"]{20,150})"/g
  let match
  
  while ((match = dialoguePattern.exec(text)) !== null && quotes.length < maxQuotes) {
    const quoteText = match[1].trim()
    
    // Skip if too short or repetitive
    if (quoteText.length < 20 || /^[A-Z\s]+$/.test(quoteText)) continue
    
    // Analyze sentiment
    const analysis = sentiment.analyze(quoteText)
    
    // Find which character might have said this (look before the quote)
    const beforeQuote = text.substring(Math.max(0, match.index - 100), match.index)
    const character = findCharacterInContext(beforeQuote, characters)
    
    // Get context around the quote
    const contextStart = Math.max(0, match.index - 50)
    const contextEnd = Math.min(text.length, match.index + match[0].length + 50)
    const context = text.substring(contextStart, contextEnd).trim()
    
    quotes.push({
      text: quoteText,
      character: character?.name || null,
      sentimentScore: analysis.score,
      sentimentLabel: getSentimentLabel(analysis.score),
      confidence: Math.abs(analysis.score) / Math.max(1, quoteText.split(' ').length),
      words: analysis.words,
      context
    })
  }
  
  // If we don't have enough quotes, add some notable sentences
  if (quotes.length < 5) {
    const notableSentences = sentences
      .filter(sentence => {
        const analysis = sentiment.analyze(sentence)
        return Math.abs(analysis.score) >= 2 // Strong sentiment
      })
      .slice(0, maxQuotes - quotes.length)
    
    notableSentences.forEach(sentence => {
      const analysis = sentiment.analyze(sentence)
      const character = findCharacterInContext(sentence, characters)
      
      quotes.push({
        text: sentence,
        character: character?.name || 'Narrator',
        sentimentScore: analysis.score,
        sentimentLabel: getSentimentLabel(analysis.score),
        confidence: Math.abs(analysis.score) / Math.max(1, sentence.split(' ').length),
        words: analysis.words,
        context: sentence
      })
    })
  }
  
  // Sort by sentiment strength and take top quotes
  return quotes
    .sort((a, b) => Math.abs(b.sentimentScore) - Math.abs(a.sentimentScore))
    .slice(0, maxQuotes)
}

/**
 * Find character mentions in context
 */
function findCharacterInContext(context: string, characters: Character[]): Character | null {
  const lowerContext = context.toLowerCase()
  
  for (const character of characters) {
    // Check main name
    if (lowerContext.includes(character.name.toLowerCase())) {
      return character
    }
    
    // Check aliases
    if (character.aliases) {
      for (const alias of character.aliases) {
        if (lowerContext.includes(alias.toLowerCase())) {
          return character
        }
      }
    }
  }
  
  return null
}

/**
 * Convert AFINN score to readable label
 */
function getSentimentLabel(score: number): AnalyzedQuote['sentimentLabel'] {
  if (score >= 3) return 'very positive'
  if (score >= 1) return 'positive'
  if (score <= -3) return 'very negative'
  if (score <= -1) return 'negative'
  return 'neutral'
}

/**
 * Analyze chapter-by-chapter character mentions
 */
export function analyzeChapterMentions(
  text: string,
  character: Character,
  chaptersCount: number = 20
): ChapterMention[] {
  // Split text into approximately equal chapters
  const textLength = text.length
  const chapterLength = Math.floor(textLength / chaptersCount)
  
  const mentions: ChapterMention[] = []
  
  // Create character name patterns
  const namePatterns = [character.name, ...(character.aliases || [])]
    .map(name => name.toLowerCase())
  
  for (let i = 0; i < chaptersCount; i++) {
    const start = i * chapterLength
    const end = Math.min(start + chapterLength, textLength)
    const chapterText = text.substring(start, end).toLowerCase()
    
    // Count mentions in this chapter
    let mentionCount = 0
    namePatterns.forEach(pattern => {
      const matches = chapterText.split(pattern).length - 1
      mentionCount += matches
    })
    
    mentions.push({
      chapter: i + 1,
      mentions: mentionCount
    })
  }
  
  return mentions
}

/**
 * Calculate weighted degree for character ranking
 */
export function calculateCharacterRankings(
  characters: Character[],
  graphData?: { nodes: any[], edges: any[] }
): CharacterRanking[] {
  return characters
    .map((character, index) => {
      // Calculate network importance if graph data available
      let networkImportance = 0
      let weightedDegree = 0
      
      if (graphData) {
        const edges = graphData.edges.filter(edge => 
          edge.source === character.name || edge.target === character.name
        )
        
        weightedDegree = edges.reduce((sum, edge) => sum + edge.weight, 0)
        networkImportance = edges.length * 10 + weightedDegree // Combined metric
      }
      
      return {
        character,
        rank: 0, // Will be set after sorting
        mentions: character.mentions,
        weightedDegree,
        networkImportance: networkImportance || character.importance // Fallback to importance
      }
    })
    .sort((a, b) => {
      // Primary sort by network importance, secondary by mentions
      if (a.networkImportance !== b.networkImportance) {
        return b.networkImportance - a.networkImportance
      }
      return b.mentions - a.mentions
    })
    .map((ranking, index) => ({
      ...ranking,
      rank: index + 1
    }))
    .slice(0, 5) // Top 5 only
}

/**
 * Get sentiment color for badges
 */
export function getSentimentColor(label: AnalyzedQuote['sentimentLabel']): string {
  switch (label) {
    case 'very positive': return 'bg-green-100 text-green-800 border-green-300'
    case 'positive': return 'bg-green-50 text-green-700 border-green-200'
    case 'neutral': return 'bg-gray-50 text-gray-700 border-gray-200'
    case 'negative': return 'bg-red-50 text-red-700 border-red-200'
    case 'very negative': return 'bg-red-100 text-red-800 border-red-300'
  }
}

/**
 * Get sentiment emoji
 */
export function getSentimentEmoji(label: AnalyzedQuote['sentimentLabel']): string {
  switch (label) {
    case 'very positive': return '😍'
    case 'positive': return '😊'
    case 'neutral': return '😐'
    case 'negative': return '😔'
    case 'very negative': return '😢'
  }
}
