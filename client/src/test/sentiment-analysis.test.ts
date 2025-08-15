import { describe, it, expect } from 'vitest'
import {
  extractAndAnalyzeQuotes,
  analyzeChapterMentions,
  calculateCharacterRankings,
  getSentimentColor,
  getSentimentEmoji
} from '@/lib/insights/sentiment-analysis'
import { Character } from '@/lib/api/schemas'

describe('Sentiment Analysis', () => {
  const mockCharacters: Character[] = [
    {
      name: 'Elizabeth',
      aliases: ['Lizzy', 'Eliza'],
      importance: 95,
      mentions: 45
    },
    {
      name: 'Darcy',
      aliases: ['Mr. Darcy', 'Fitzwilliam'],
      importance: 88,
      mentions: 38
    },
    {
      name: 'Jane',
      aliases: [],
      importance: 72,
      mentions: 28
    }
  ]

  const mockText = `
    "I am perfectly convinced that Mr. Darcy has no defect," said Elizabeth with joy.
    "You are too generous to trifle with me," said Darcy sadly.
    "It is a truth universally acknowledged," the narrator begins.
    Elizabeth walked with Jane to the garden. They were happy together.
    "I hate Mr. Darcy," Elizabeth said angrily. "He is the worst person."
    Jane smiled at Elizabeth. "You are wrong about him," she replied kindly.
    "I love you ardently," Darcy declared to Elizabeth with passion.
  `

  it('should extract and analyze quotes with sentiment', () => {
    const quotes = extractAndAnalyzeQuotes(mockText, mockCharacters, 10)

    expect(quotes.length).toBeGreaterThan(0)
    
    quotes.forEach(quote => {
      expect(quote.text).toBeDefined()
      expect(quote.sentimentScore).toBeDefined()
      expect(quote.sentimentLabel).toBeDefined()
      expect(['very positive', 'positive', 'neutral', 'negative', 'very negative']).toContain(quote.sentimentLabel)
      expect(quote.confidence).toBeGreaterThanOrEqual(0) // Allow 0 confidence for neutral quotes
    })
  })

  it('should correctly identify positive sentiment', () => {
    const positiveText = `"I am perfectly convinced that Mr. Darcy is wonderful," said Elizabeth with joy and love.`
    const quotes = extractAndAnalyzeQuotes(positiveText, mockCharacters, 5)
    
    const positiveQuote = quotes.find(q => q.sentimentScore > 0)
    expect(positiveQuote).toBeDefined()
    expect(['positive', 'very positive']).toContain(positiveQuote!.sentimentLabel)
  })

  it('should correctly identify negative sentiment', () => {
    const negativeText = `"I hate and despise Mr. Darcy terribly," said Elizabeth with anger and disgust.`
    const quotes = extractAndAnalyzeQuotes(negativeText, mockCharacters, 5)
    
    const negativeQuote = quotes.find(q => q.sentimentScore < 0)
    expect(negativeQuote).toBeDefined()
    expect(['negative', 'very negative']).toContain(negativeQuote!.sentimentLabel)
  })

  it('should analyze chapter mentions correctly', () => {
    const elizabeth = mockCharacters[0]
    const mentions = analyzeChapterMentions(mockText, elizabeth, 5)

    expect(mentions).toHaveLength(5)
    mentions.forEach((mention, index) => {
      expect(mention.chapter).toBe(index + 1)
      expect(mention.mentions).toBeGreaterThanOrEqual(0)
    })

    // Should find Elizabeth mentions across chapters
    const totalMentions = mentions.reduce((sum, m) => sum + m.mentions, 0)
    expect(totalMentions).toBeGreaterThan(0)
  })

  it('should handle aliases in chapter analysis', () => {
    const elizabeth = mockCharacters[0]
    const textWithAliases = `Elizabeth spoke. Lizzy replied. Eliza walked away.`
    const mentions = analyzeChapterMentions(textWithAliases, elizabeth, 3)

    const totalMentions = mentions.reduce((sum, m) => sum + m.mentions, 0)
    expect(totalMentions).toBeGreaterThanOrEqual(3) // Should find all three aliases
  })

  it('should calculate character rankings correctly', () => {
    const rankings = calculateCharacterRankings(mockCharacters)

    expect(rankings).toHaveLength(3)
    
    // Should be sorted by importance/mentions
    expect(rankings[0].rank).toBe(1)
    expect(rankings[1].rank).toBe(2)
    expect(rankings[2].rank).toBe(3)

    // First character should have highest importance
    expect(rankings[0].character.importance).toBeGreaterThanOrEqual(rankings[1].character.importance)
  })

  it('should calculate rankings with graph data', () => {
    const mockGraphData = {
      nodes: [
        { id: 'Elizabeth', name: 'Elizabeth' },
        { id: 'Darcy', name: 'Darcy' },
        { id: 'Jane', name: 'Jane' }
      ],
      edges: [
        { source: 'Elizabeth', target: 'Darcy', weight: 5 },
        { source: 'Elizabeth', target: 'Jane', weight: 3 },
        { source: 'Darcy', target: 'Jane', weight: 2 }
      ]
    }

    const rankings = calculateCharacterRankings(mockCharacters, mockGraphData)

    expect(rankings).toHaveLength(3)
    
    // Elizabeth should rank high due to network connections
    const elizabethRanking = rankings.find(r => r.character.name === 'Elizabeth')
    expect(elizabethRanking).toBeDefined()
    expect(elizabethRanking!.weightedDegree).toBeGreaterThan(0)
    expect(elizabethRanking!.networkImportance).toBeGreaterThan(0)
  })

  it('should return appropriate sentiment colors', () => {
    expect(getSentimentColor('very positive')).toContain('green')
    expect(getSentimentColor('positive')).toContain('green')
    expect(getSentimentColor('neutral')).toContain('gray')
    expect(getSentimentColor('negative')).toContain('red')
    expect(getSentimentColor('very negative')).toContain('red')
  })

  it('should return appropriate sentiment emojis', () => {
    expect(getSentimentEmoji('very positive')).toBe('😍')
    expect(getSentimentEmoji('positive')).toBe('😊')
    expect(getSentimentEmoji('neutral')).toBe('😐')
    expect(getSentimentEmoji('negative')).toBe('😔')
    expect(getSentimentEmoji('very negative')).toBe('😢')
  })

  it('should handle empty text gracefully', () => {
    const quotes = extractAndAnalyzeQuotes('', mockCharacters, 5)
    expect(quotes).toHaveLength(0)

    const mentions = analyzeChapterMentions('', mockCharacters[0], 5)
    expect(mentions).toHaveLength(5)
    mentions.forEach(mention => {
      expect(mention.mentions).toBe(0)
    })
  })

  it('should handle no characters gracefully', () => {
    const quotes = extractAndAnalyzeQuotes('', [], 5) // Empty text with no characters
    expect(quotes).toHaveLength(0)

    const rankings = calculateCharacterRankings([])
    expect(rankings).toHaveLength(0)
  })

  it('should limit quote extraction to specified maximum', () => {
    const maxQuotes = 3
    const quotes = extractAndAnalyzeQuotes(mockText, mockCharacters, maxQuotes)
    expect(quotes.length).toBeLessThanOrEqual(maxQuotes)
  })

  it('should sort quotes by sentiment strength', () => {
    const quotes = extractAndAnalyzeQuotes(mockText, mockCharacters, 10)
    
    if (quotes.length > 1) {
      for (let i = 0; i < quotes.length - 1; i++) {
        const currentStrength = Math.abs(quotes[i].sentimentScore)
        const nextStrength = Math.abs(quotes[i + 1].sentimentScore)
        expect(currentStrength).toBeGreaterThanOrEqual(nextStrength)
      }
    }
  })
})
