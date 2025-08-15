import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Network, Clock, Brain, AlertCircle } from 'lucide-react'
import { useAnalysisResults } from '@/contexts/analysis-context'
import { CharacterNetworkGraph } from '@/components/ui/character-network-graph'
import { EnhancedNetworkGraph } from '@/components/ui/enhanced-network-graph'
import { CharacterTimelines } from '@/components/ui/character-timelines'

export function EnhancedGraphSection() {
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

  // Component state
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)

  // Calculate stats
  const totalCharacters = characters.length
  const avgImportance = characters.length > 0 
    ? Math.round(characters.reduce((sum, char) => sum + char.importance, 0) / characters.length)
    : 0
  const avgMentions = characters.length > 0
    ? Math.round(characters.reduce((sum, char) => sum + char.mentions, 0) / characters.length)
    : 0
  const processingTime = characterResults?.processing_time_ms || 0

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
        <h2 id="graph-heading" className="text-3xl sm:text-4xl font-bold text-foreground">
          Character Network
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {isAnalyzing ? 
            'Building interactive character network...' : 
            'Explore character relationships through co-occurrence analysis.'
          }
        </p>
        {hasResults && (
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="default" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              {analysisMethod?.toUpperCase()} Analysis
            </Badge>
            <Badge variant="outline">
              Live Network
            </Badge>
          </div>
        )}
      </motion.div>

      {/* Interactive Character Network Graph */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {isAnalyzing ? (
          <Card className="min-h-[600px]">
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center space-y-2">
                <div className="animate-pulse">
                  <Network className="h-12 w-12 text-primary mx-auto animate-spin" />
                </div>
                <p className="text-foreground font-medium">
                  {currentStep === 'graph' ? 'Building character network...' : 'Waiting for analysis...'}
                </p>
                <Badge variant="default">
                  {currentStep}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : hasResults && bookText ? (
          <CharacterNetworkGraph 
            characters={characters} 
            bookText={bookText}
          />
        ) : (
          <Card className="min-h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Interactive Character Network
              </CardTitle>
              <CardDescription>
                Run a character analysis to see the interactive network visualization
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center space-y-2">
                <Network className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  No character data available
                </p>
                <Badge variant="outline">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Run analysis above
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Quick Stats Summary */}
      {hasResults && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Top Characters</CardTitle>
              <CardDescription>
                Most important characters by analysis score
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {characters
                .slice()
                .sort((a, b) => b.importance - a.importance)
                .slice(0, 5)
                .map((character, index) => (
                  <div key={character.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{character.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {character.mentions} mentions
                        </p>
                        {character.aliases && character.aliases.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Aliases: {character.aliases.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {character.importance}/100
                    </Badge>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analysis Summary</CardTitle>
              <CardDescription>
                Key metrics from character analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{totalCharacters}</p>
                  <p className="text-sm text-muted-foreground">Total Characters</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{avgImportance}</p>
                  <p className="text-sm text-muted-foreground">Avg Importance</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{avgMentions}</p>
                  <p className="text-sm text-muted-foreground">Avg Mentions</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{processingTime}ms</p>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    Processing
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                  Book: {bookTitle} by {bookAuthor}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Analysis method: {analysisMethod?.toUpperCase()} • Interactive network ready
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
