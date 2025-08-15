import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { 
  GitCompareArrows,
  BookOpen,
  Users,
  Network,
  Heart,
  TrendingUp,
  Download,
  X,
  Loader2,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react'
import { useWorkerAnalysis } from '@/hooks/use-worker-analysis'
import { Character } from '@/lib/api/schemas'
import { GraphData, GraphNode, GraphEdge } from '@/lib/graph/co-occurrence'
import { NetworkMetrics, NetworkStats } from '@/lib/analysis/network-metrics'
import { EnhancedQuote } from '@/lib/analysis/enhanced-sentiment'
import ForceGraph2D from 'react-force-graph-2d'
import { toast } from 'sonner'

export interface ComparisonResult {
  bookId: string
  title: string
  author: string
  characters: Character[]
  graphData: GraphData
  networkMetrics: NetworkMetrics[]
  networkStats: NetworkStats
  quotes: EnhancedQuote[]
  totalWords: number
  processingTime: number
}

export interface BookComparisonProps {
  currentBook?: ComparisonResult
  onComparisonComplete?: (comparison: BookComparison) => void
  className?: string
}

export interface BookComparison {
  book1: ComparisonResult
  book2: ComparisonResult
  metrics: ComparisonMetrics
}

export interface ComparisonMetrics {
  characterOverlap: number
  networkDensityRatio: number
  avgDegreeRatio: number
  sentimentDifference: number
  complexityScore: number
  similarityIndex: number
}

export function BookComparison({ 
  currentBook, 
  onComparisonComplete,
  className 
}: BookComparisonProps) {
  
  // Component state
  const [isExpanded, setIsExpanded] = useState(false)
  const [compareBookId, setCompareBookId] = useState('')
  const [comparison, setComparison] = useState<BookComparison | null>(null)
  const [showOverlay, setShowOverlay] = useState(true)
  const [overlayMode, setOverlayMode] = useState<'separate' | 'merged'>('separate')
  
  // Worker analysis for second book
  const workerAnalysis = useWorkerAnalysis()
  const graphRef = useRef<any>()

  // Validate book ID format
  const isValidBookId = /^\d+$/.test(compareBookId.trim())

  /**
   * Start comparison analysis
   */
  const handleStartComparison = useCallback(async () => {
    if (!currentBook || !isValidBookId) return

    try {
      // Start analysis of second book
      await workerAnalysis.startAnalysis(compareBookId.trim(), {
        forceRecompute: false,
        windowSize: 3,
        minEdgeWeight: 2,
        minMentions: 2
      })

      // Wait for completion
      // Note: In a real implementation, you'd listen to the worker state
      // For now, we'll simulate the completion
      
    } catch (error) {
      console.error('Comparison analysis failed:', error)
      toast.error('Failed to analyze comparison book')
    }
  }, [currentBook, compareBookId, isValidBookId, workerAnalysis])

  /**
   * Process comparison results when second book analysis completes
   */
  const processComparison = useCallback((book2Data: any) => {
    if (!currentBook) return

    const book2: ComparisonResult = {
      bookId: compareBookId,
      title: book2Data.bookTitle || `Book ${compareBookId}`,
      author: book2Data.bookAuthor || 'Unknown Author',
      characters: book2Data.characters || [],
      graphData: book2Data.graphData || { nodes: [], edges: [] },
      networkMetrics: book2Data.networkMetrics || [],
      networkStats: book2Data.networkStats || {
        density: 0,
        averageDegree: 0,
        components: 1,
        modularity: 0,
        diameter: 0,
        clustering: 0
      },
      quotes: book2Data.enhancedQuotes || [],
      totalWords: book2Data.stats?.textLength || 0,
      processingTime: book2Data.stats?.processingTime || 0
    }

    // Calculate comparison metrics
    const metrics = calculateComparisonMetrics(currentBook, book2)

    const comparisonResult: BookComparison = {
      book1: currentBook,
      book2,
      metrics
    }

    setComparison(comparisonResult)
    onComparisonComplete?.(comparisonResult)
    toast.success('Book comparison completed!')
  }, [currentBook, compareBookId, onComparisonComplete])

  /**
   * Clear comparison
   */
  const clearComparison = useCallback(() => {
    setComparison(null)
    setCompareBookId('')
    workerAnalysis.reset?.()
  }, [workerAnalysis])

  /**
   * Export comparison data
   */
  const exportComparison = useCallback(() => {
    if (!comparison) return

    const exportData = {
      comparison: {
        book1: {
          id: comparison.book1.bookId,
          title: comparison.book1.title,
          author: comparison.book1.author,
          characterCount: comparison.book1.characters.length,
          networkDensity: comparison.book1.networkStats.density,
          averageDegree: comparison.book1.networkStats.averageDegree
        },
        book2: {
          id: comparison.book2.bookId,
          title: comparison.book2.title,
          author: comparison.book2.author,
          characterCount: comparison.book2.characters.length,
          networkDensity: comparison.book2.networkStats.density,
          averageDegree: comparison.book2.networkStats.averageDegree
        },
        metrics: comparison.metrics
      },
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `book-comparison-${comparison.book1.bookId}-vs-${comparison.book2.bookId}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Comparison data exported!')
  }, [comparison])

  return (
    <div className={className}>
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompareArrows className="h-5 w-5" />
              Compare Two Books
              {comparison && (
                <Badge variant="secondary" className="ml-2">
                  Active Comparison
                </Badge>
              )}
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <TrendingUp className="h-4 w-4" />
            </motion.div>
          </CardTitle>
          {!isExpanded && comparison && (
            <div className="text-sm text-muted-foreground">
              {comparison.book1.title} vs {comparison.book2.title}
            </div>
          )}
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="space-y-6">
                
                {/* Input Section */}
                {!comparison && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Compare with Book ID
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter Gutenberg book ID (e.g., 1342)"
                          value={compareBookId}
                          onChange={(e) => setCompareBookId(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleStartComparison}
                          disabled={!isValidBookId || !currentBook || workerAnalysis.isAnalyzing}
                        >
                          {workerAnalysis.isAnalyzing ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <GitCompareArrows className="h-4 w-4 mr-2" />
                          )}
                          Compare
                        </Button>
                      </div>
                      {!isValidBookId && compareBookId && (
                        <p className="text-sm text-destructive mt-1">
                          Please enter a valid numeric book ID
                        </p>
                      )}
                    </div>

                    {/* Current Book Info */}
                    {currentBook && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <h4 className="font-medium text-sm mb-1">Current Book</h4>
                        <p className="text-sm">{currentBook.title} by {currentBook.author}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{currentBook.characters.length} characters</span>
                          <span>Density: {(currentBook.networkStats.density * 100).toFixed(1)}%</span>
                          <span>Avg Degree: {currentBook.networkStats.averageDegree.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Analysis Progress */}
                {workerAnalysis.isAnalyzing && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Analyzing comparison book...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={workerAnalysis.cancelAnalysis}
                      >
                        Cancel
                      </Button>
                    </div>
                    <Progress value={workerAnalysis.progress} className="w-full" />
                    <p className="text-xs text-muted-foreground">
                      {workerAnalysis.message}
                    </p>
                  </div>
                )}

                {/* Comparison Results */}
                {comparison && (
                  <div className="space-y-6">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Comparison Results</h3>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={exportComparison}>
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                        <Button variant="outline" size="sm" onClick={clearComparison}>
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      </div>
                    </div>

                    {/* Book Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <BookInfoCard book={comparison.book1} label="Book 1" />
                      <BookInfoCard book={comparison.book2} label="Book 2" />
                    </div>

                    {/* Comparison Metrics */}
                    <ComparisonMetricsDisplay metrics={comparison.metrics} />

                    {/* Network Overlay Visualization */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Network Overlay</h4>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={showOverlay}
                              onCheckedChange={setShowOverlay}
                            />
                            <span className="text-sm">Show Overlay</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant={overlayMode === 'separate' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setOverlayMode('separate')}
                            >
                              Separate
                            </Button>
                            <Button
                              variant={overlayMode === 'merged' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setOverlayMode('merged')}
                            >
                              Merged
                            </Button>
                          </div>
                        </div>
                      </div>

                      {showOverlay && (
                        <NetworkOverlay 
                          comparison={comparison} 
                          mode={overlayMode}
                          ref={graphRef}
                        />
                      )}
                    </div>

                    {/* Character Overlap Analysis */}
                    <CharacterOverlapAnalysis comparison={comparison} />
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}

/**
 * Individual book info card
 */
function BookInfoCard({ book, label }: { book: ComparisonResult, label: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="font-medium">{book.title}</h4>
          <p className="text-sm text-muted-foreground">by {book.author}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3" />
            <span>{book.characters.length} characters</span>
          </div>
          <div className="flex items-center gap-2">
            <Network className="h-3 w-3" />
            <span>{book.graphData.edges.length} connections</span>
          </div>
          <div>
            <span className="text-muted-foreground">Density:</span>
            <span className="ml-1 font-medium">
              {(book.networkStats.density * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Avg Degree:</span>
            <span className="ml-1 font-medium">
              {book.networkStats.averageDegree.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground">Sentiment Distribution</h5>
          <SentimentBar quotes={book.quotes} />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Comparison metrics display
 */
function ComparisonMetricsDisplay({ metrics }: { metrics: ComparisonMetrics }) {
  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600'
    if (score >= 0.4) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comparative Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className={`text-2xl font-bold ${getScoreColor(metrics.similarityIndex)}`}>
              {(metrics.similarityIndex * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Similarity Index</p>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-primary">
              {metrics.characterOverlap}
            </p>
            <p className="text-xs text-muted-foreground">Character Overlap</p>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-primary">
              {metrics.networkDensityRatio.toFixed(2)}x
            </p>
            <p className="text-xs text-muted-foreground">Density Ratio</p>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-primary">
              {metrics.avgDegreeRatio.toFixed(2)}x
            </p>
            <p className="text-xs text-muted-foreground">Degree Ratio</p>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-primary">
              {Math.abs(metrics.sentimentDifference).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Sentiment Δ</p>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-primary">
              {metrics.complexityScore.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">Complexity Score</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Network overlay visualization
 */
const NetworkOverlay = React.forwardRef<any, {
  comparison: BookComparison
  mode: 'separate' | 'merged'
}>(({ comparison, mode }, ref) => {
  
  const overlayData = React.useMemo(() => {
    if (mode === 'separate') {
      // Side by side networks
      const book1Nodes = comparison.book1.graphData.nodes.map(node => ({
        ...node,
        x: node.x ? node.x - 200 : undefined,
        color: '#3b82f6',
        book: 1
      }))
      
      const book2Nodes = comparison.book2.graphData.nodes.map(node => ({
        ...node,
        x: node.x ? node.x + 200 : undefined,
        color: '#ef4444',
        book: 2
      }))
      
      const book1Edges = comparison.book1.graphData.edges.map(edge => ({
        ...edge,
        color: '#3b82f6'
      }))
      
      const book2Edges = comparison.book2.graphData.edges.map(edge => ({
        ...edge,
        color: '#ef4444'
      }))
      
      return {
        nodes: [...book1Nodes, ...book2Nodes],
        edges: [...book1Edges, ...book2Edges]
      }
    } else {
      // Merged network with character overlap
      const allCharacters = new Map<string, GraphNode>()
      
      // Add book 1 characters
      comparison.book1.graphData.nodes.forEach(node => {
        allCharacters.set(node.name.toLowerCase(), {
          ...node,
          color: '#3b82f6',
          books: [1]
        })
      })
      
      // Add book 2 characters, mark overlaps
      comparison.book2.graphData.nodes.forEach(node => {
        const existing = allCharacters.get(node.name.toLowerCase())
        if (existing) {
          existing.color = '#8b5cf6' // Purple for overlap
          existing.books = [1, 2]
          existing.size = (existing.size || 1) + (node.size || 1)
        } else {
          allCharacters.set(node.name.toLowerCase(), {
            ...node,
            color: '#ef4444',
            books: [2]
          })
        }
      })
      
      const mergedEdges = [
        ...comparison.book1.graphData.edges.map(edge => ({ ...edge, color: '#3b82f6' })),
        ...comparison.book2.graphData.edges.map(edge => ({ ...edge, color: '#ef4444' }))
      ]
      
      return {
        nodes: Array.from(allCharacters.values()),
        edges: mergedEdges
      }
    }
  }, [comparison, mode])

  return (
    <div className="w-full h-[400px] border rounded-lg overflow-hidden bg-background">
      <ForceGraph2D
        ref={ref}
        graphData={overlayData}
        width={undefined}
        height={400}
        backgroundColor="transparent"
        nodeId="id"
        nodeLabel="name"
        nodeColor="color"
        nodeVal={(node: any) => (node.size || 1) * 2}
        linkColor="color"
        linkWidth={(link: any) => Math.sqrt(link.weight || 1)}
        linkOpacity={0.6}
        warmupTicks={100}
        cooldownTicks={0}
      />
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur rounded p-2 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Book 1</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Book 2</span>
          </div>
          {mode === 'merged' && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Overlap</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
NetworkOverlay.displayName = 'NetworkOverlay'

/**
 * Character overlap analysis
 */
function CharacterOverlapAnalysis({ comparison }: { comparison: BookComparison }) {
  const overlappingCharacters = React.useMemo(() => {
    const book1Names = new Set(comparison.book1.characters.map(c => c.name.toLowerCase()))
    const book2Names = new Set(comparison.book2.characters.map(c => c.name.toLowerCase()))
    
    return comparison.book1.characters.filter(char => 
      book2Names.has(char.name.toLowerCase())
    )
  }, [comparison])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Character Overlap Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {overlappingCharacters.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Found {overlappingCharacters.length} common character{overlappingCharacters.length !== 1 ? 's' : ''}:
            </p>
            <div className="flex flex-wrap gap-2">
              {overlappingCharacters.map(char => (
                <Badge key={char.name} variant="secondary">
                  {char.name}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No common characters found between the two books.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Sentiment distribution bar
 */
function SentimentBar({ quotes }: { quotes: EnhancedQuote[] }) {
  const sentimentCounts = React.useMemo(() => {
    let positive = 0, neutral = 0, negative = 0
    
    quotes.forEach(quote => {
      if (quote.sentiment > 0.1) positive++
      else if (quote.sentiment < -0.1) negative++
      else neutral++
    })
    
    const total = positive + neutral + negative
    return {
      positive: total > 0 ? (positive / total) * 100 : 0,
      neutral: total > 0 ? (neutral / total) * 100 : 0,
      negative: total > 0 ? (negative / total) * 100 : 0
    }
  }, [quotes])

  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
      <div 
        className="bg-green-500" 
        style={{ width: `${sentimentCounts.positive}%` }}
      />
      <div 
        className="bg-gray-400" 
        style={{ width: `${sentimentCounts.neutral}%` }}
      />
      <div 
        className="bg-red-500" 
        style={{ width: `${sentimentCounts.negative}%` }}
      />
    </div>
  )
}

/**
 * Calculate comparison metrics between two books
 */
function calculateComparisonMetrics(
  book1: ComparisonResult, 
  book2: ComparisonResult
): ComparisonMetrics {
  
  // Character overlap
  const book1Names = new Set(book1.characters.map(c => c.name.toLowerCase()))
  const book2Names = new Set(book2.characters.map(c => c.name.toLowerCase()))
  const overlap = new Set([...book1Names].filter(name => book2Names.has(name)))
  const characterOverlap = overlap.size

  // Network metrics ratios
  const networkDensityRatio = book2.networkStats.density / (book1.networkStats.density || 0.001)
  const avgDegreeRatio = book2.networkStats.averageDegree / (book1.networkStats.averageDegree || 0.001)

  // Sentiment difference
  const book1Sentiment = book1.quotes.reduce((sum, q) => sum + q.sentiment, 0) / (book1.quotes.length || 1)
  const book2Sentiment = book2.quotes.reduce((sum, q) => sum + q.sentiment, 0) / (book2.quotes.length || 1)
  const sentimentDifference = book2Sentiment - book1Sentiment

  // Complexity score (characters * density * avg_degree)
  const book1Complexity = book1.characters.length * book1.networkStats.density * book1.networkStats.averageDegree
  const book2Complexity = book2.characters.length * book2.networkStats.density * book2.networkStats.averageDegree
  const complexityScore = (book1Complexity + book2Complexity) / 2

  // Similarity index (based on multiple factors)
  const sizeSimilarity = 1 - Math.abs(book1.characters.length - book2.characters.length) / Math.max(book1.characters.length, book2.characters.length)
  const densitySimilarity = 1 - Math.abs(book1.networkStats.density - book2.networkStats.density)
  const sentimentSimilarity = 1 - Math.abs(sentimentDifference) / 2 // Normalize to 0-1
  const overlapSimilarity = characterOverlap / Math.max(book1.characters.length, book2.characters.length)
  
  const similarityIndex = (sizeSimilarity + densitySimilarity + sentimentSimilarity + overlapSimilarity) / 4

  return {
    characterOverlap,
    networkDensityRatio,
    avgDegreeRatio,
    sentimentDifference,
    complexityScore,
    similarityIndex
  }
}
