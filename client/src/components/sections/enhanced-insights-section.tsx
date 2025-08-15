import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChapterSparkline } from '@/components/ui/sparkline'
import { 
  Quote, 
  TrendingUp, 
  Brain, 
  AlertCircle, 
  Crown,
  Zap,
  Activity,
  MessageSquare
} from 'lucide-react'
import { useAnalysisResults } from '@/contexts/analysis-context'
import { ExportSharePanel } from '@/components/ui/export-share-panel'
import { 
  extractAndAnalyzeQuotes,
  analyzeChapterMentions,
  calculateCharacterRankings,
  getSentimentColor,
  getSentimentEmoji,

} from '@/lib/insights/sentiment-analysis'
import { useMemo } from 'react'

export function EnhancedInsightsSection() {
  const { 
    hasResults, 
    characters, 
    bookTitle, 
    bookAuthor, 
    analysisMethod,
    characterResults,
    isAnalyzing,
    currentStep,
    bookText
  } = useAnalysisResults()

  // Compute insights when we have data
  const insights = useMemo(() => {
    if (!hasResults || !bookText || !characters.length) {
      return {
        quotes: [],
        rankings: [],
        chapterMentions: new Map()
      }
    }

    const quotes = extractAndAnalyzeQuotes(bookText, characters, 8)
    const rankings = calculateCharacterRankings(characters)
    
    // Generate chapter mentions for top 3 characters
    const chapterMentions = new Map()
    rankings.slice(0, 3).forEach(ranking => {
      const mentions = analyzeChapterMentions(bookText, ranking.character, 15)
      chapterMentions.set(ranking.character.name, mentions)
    })

    return { quotes, rankings, chapterMentions }
  }, [hasResults, bookText, characters])

  return (
    <div className="space-y-12">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <h2 id="insights-heading" className="text-3xl sm:text-4xl font-bold text-foreground">
          Story Insights
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {isAnalyzing ? 
            'Analyzing narrative patterns and extracting insights...' :
            'Deep analysis of character dynamics, sentiment patterns, and narrative structure.'
          }
        </p>
        {hasResults && (
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="default" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              AI-Powered Insights
            </Badge>
            <Badge variant="outline">
              AFINN Sentiment Analysis
            </Badge>
          </div>
        )}
      </motion.div>

      {/* Main Insights Grid */}
      {isAnalyzing ? (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="min-h-[400px]">
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center space-y-2">
                <div className="animate-pulse">
                  <Brain className="h-12 w-12 text-primary mx-auto animate-pulse" />
                </div>
                <p className="text-foreground font-medium">
                  {currentStep === 'insights' ? 'Generating story insights...' : 'Waiting for analysis...'}
                </p>
                <Badge variant="default">{currentStep}</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : hasResults ? (
        <>
          {/* Top Characters Ranking */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Top Characters by Network Importance
                </CardTitle>
                <CardDescription>
                  Ranked by mentions and weighted network degree
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.rankings.map((ranking, index) => (
                  <div key={ranking.character.name} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {ranking.rank}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold">{ranking.character.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {ranking.mentions} mentions
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {ranking.character.importance}/100 importance
                          </span>
                          {ranking.weightedDegree > 0 && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {ranking.weightedDegree} network weight
                            </span>
                          )}
                        </div>
                        {ranking.character.aliases && ranking.character.aliases.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Also known as: {ranking.character.aliases.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Chapter mentions sparkline */}
                    {insights.chapterMentions.has(ranking.character.name) && (
                      <div className="text-right space-y-1">
                        <p className="text-xs text-muted-foreground">Chapter mentions</p>
                        <ChapterSparkline
                          mentions={insights.chapterMentions.get(ranking.character.name)!}
                          characterName={ranking.character.name}
                          width={80}
                          height={20}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sentiment Analysis of Key Quotes */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Quote className="h-5 w-5" />
                  Key Quotes with Sentiment Analysis
                </CardTitle>
                <CardDescription>
                  Extracted dialogue and notable passages with AFINN sentiment scoring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.quotes.length > 0 ? (
                  insights.quotes.map((quote, index) => (
                    <div key={index} className="p-4 rounded-lg border-l-4 border-primary bg-muted/30 space-y-3">
                      <blockquote className="text-foreground italic leading-relaxed">
                        "{quote.text}"
                      </blockquote>
                      
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            — {quote.character || 'Unknown'}
                          </span>
                          {quote.character && (
                            <Badge variant="outline" className="text-xs">
                              Character
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getSentimentColor(quote.sentimentLabel)}`}
                          >
                            {getSentimentEmoji(quote.sentimentLabel)} {quote.sentimentLabel}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Score: {quote.sentimentScore > 0 ? '+' : ''}{quote.sentimentScore}
                          </Badge>
                        </div>
                      </div>
                      
                      {quote.words.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Key words:</span> {quote.words.join(', ')}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Quote className="h-8 w-8 mx-auto mb-2" />
                    <p>No quotes extracted</p>
                    <p className="text-xs">Try analyzing a different book</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Analysis Summary */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Book Info */}
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Analysis Complete
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      "{bookTitle}" by {bookAuthor}
                    </p>
                    <div className="flex justify-center gap-2 mt-2">
                      <Badge variant="outline">{characters.length} Characters</Badge>
                      <Badge variant="outline">{insights.quotes.length} Quotes</Badge>
                    </div>
                  </div>

                  {/* Sentiment Distribution */}
                  <div className="text-center space-y-2">
                    <h4 className="font-medium text-foreground">Sentiment Overview</h4>
                    <div className="space-y-1">
                      {insights.quotes.length > 0 ? (
                        (() => {
                          const sentimentCounts = insights.quotes.reduce((acc, quote) => {
                            acc[quote.sentimentLabel] = (acc[quote.sentimentLabel] || 0) + 1
                            return acc
                          }, {} as Record<string, number>)
                          
                          const totalQuotes = insights.quotes.length
                          const avgSentiment = insights.quotes.reduce((sum, q) => sum + q.sentimentScore, 0) / totalQuotes
                          
                          return (
                            <>
                              <p className="text-sm text-muted-foreground">
                                Average sentiment: <span className="font-medium">{avgSentiment.toFixed(1)}</span>
                              </p>
                              <div className="flex justify-center gap-1 text-xs">
                                {Object.entries(sentimentCounts).map(([label, count]) => (
                                  <Badge key={label} variant="outline" className="text-xs">
                                    {count} {label}
                                  </Badge>
                                ))}
                              </div>
                            </>
                          )
                        })()
                      ) : (
                        <p className="text-sm text-muted-foreground">No sentiment data</p>
                      )}
                    </div>
                  </div>

                  {/* Analysis Method */}
                  <div className="text-center space-y-2">
                    <h4 className="font-medium text-foreground">Analysis Method</h4>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Character extraction: <span className="font-medium">{analysisMethod?.toUpperCase()}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Sentiment analysis: <span className="font-medium">AFINN</span>
                      </p>
                      <Badge variant="outline" className="text-xs">
                        <Activity className="h-3 w-3 mr-1" />
                        {characterResults?.processing_time_ms}ms processing
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="min-h-[400px]">
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center space-y-2">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  No analysis data available
                </p>
                <Badge variant="outline">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Run character analysis to see insights
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
