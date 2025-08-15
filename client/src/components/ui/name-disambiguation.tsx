import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { 
  Users,
  ArrowRight,
  Check,
  X,
  Zap,
  Brain,
  AlertTriangle,
  RefreshCw,
  Download
} from 'lucide-react'
import { Character } from '@/lib/api/schemas'
import { toast } from 'sonner'

export interface NameSuggestion {
  id: string
  primaryName: string
  aliases: string[]
  confidence: number
  reasoning: string
  characters: Character[]
  estimatedMentions: number
  mergeType: 'exact' | 'prefix' | 'fuzzy' | 'title'
}

export interface NameDisambiguationProps {
  characters: Character[]
  onMergeAccepted?: (suggestion: NameSuggestion) => void
  onMergeRejected?: (suggestion: NameSuggestion) => void
  onBulkApply?: (suggestions: NameSuggestion[]) => void
  className?: string
}

export function NameDisambiguation({
  characters,
  onMergeAccepted,
  onMergeRejected,
  onBulkApply,
  className
}: NameDisambiguationProps) {
  
  // Component state
  const [suggestions, setSuggestions] = useState<NameSuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [autoMode, setAutoMode] = useState(false)
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set())
  const [rejectedSuggestions, setRejectedSuggestions] = useState<Set<string>>(new Set())

  // Generate suggestions based on character names
  const generateSuggestions = useCallback(async () => {
    setIsAnalyzing(true)
    
    try {
      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newSuggestions = analyzeNameSimilarities(characters)
      setSuggestions(newSuggestions)
      
      if (newSuggestions.length === 0) {
        toast.success('No merge suggestions found - character names look clean!')
      } else {
        toast.success(`Found ${newSuggestions.length} potential merges`)
      }
    } catch (error) {
      console.error('Name analysis failed:', error)
      toast.error('Failed to analyze character names')
    } finally {
      setIsAnalyzing(false)
    }
  }, [characters])

  // Handle suggestion acceptance
  const handleAccept = useCallback((suggestion: NameSuggestion) => {
    setAppliedSuggestions(prev => new Set(prev).add(suggestion.id))
    onMergeAccepted?.(suggestion)
    toast.success(`Merged "${suggestion.aliases.join(', ')}" → "${suggestion.primaryName}"`)
  }, [onMergeAccepted])

  // Handle suggestion rejection
  const handleReject = useCallback((suggestion: NameSuggestion) => {
    setRejectedSuggestions(prev => new Set(prev).add(suggestion.id))
    onMergeRejected?.(suggestion)
    toast.info('Merge suggestion rejected')
  }, [onMergeRejected])

  // Apply all high-confidence suggestions
  const handleBulkApply = useCallback(() => {
    const highConfidenceSuggestions = suggestions.filter(
      s => s.confidence >= 0.8 && 
      !appliedSuggestions.has(s.id) && 
      !rejectedSuggestions.has(s.id)
    )
    
    if (highConfidenceSuggestions.length === 0) {
      toast.info('No high-confidence suggestions to apply')
      return
    }

    highConfidenceSuggestions.forEach(suggestion => {
      setAppliedSuggestions(prev => new Set(prev).add(suggestion.id))
    })
    
    onBulkApply?.(highConfidenceSuggestions)
    toast.success(`Applied ${highConfidenceSuggestions.length} high-confidence merges`)
  }, [suggestions, appliedSuggestions, rejectedSuggestions, onBulkApply])

  // Export merge decisions
  const exportDecisions = useCallback(() => {
    const decisions = suggestions.map(s => ({
      suggestion: {
        primaryName: s.primaryName,
        aliases: s.aliases,
        confidence: s.confidence,
        reasoning: s.reasoning,
        mergeType: s.mergeType
      },
      decision: appliedSuggestions.has(s.id) ? 'accepted' : 
                rejectedSuggestions.has(s.id) ? 'rejected' : 'pending'
    }))

    const exportData = {
      decisions,
      stats: {
        totalSuggestions: suggestions.length,
        accepted: appliedSuggestions.size,
        rejected: rejectedSuggestions.size,
        pending: suggestions.length - appliedSuggestions.size - rejectedSuggestions.size
      },
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `name-disambiguation-decisions.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Decisions exported!')
  }, [suggestions, appliedSuggestions, rejectedSuggestions])

  // Filter pending suggestions
  const pendingSuggestions = useMemo(() => 
    suggestions.filter(s => 
      !appliedSuggestions.has(s.id) && 
      !rejectedSuggestions.has(s.id)
    ), [suggestions, appliedSuggestions, rejectedSuggestions]
  )

  // Stats
  const stats = useMemo(() => ({
    total: suggestions.length,
    pending: pendingSuggestions.length,
    accepted: appliedSuggestions.size,
    rejected: rejectedSuggestions.size,
    highConfidence: pendingSuggestions.filter(s => s.confidence >= 0.8).length
  }), [suggestions, pendingSuggestions, appliedSuggestions, rejectedSuggestions])

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Name Disambiguation Helper
              {stats.total > 0 && (
                <Badge variant="secondary">
                  {stats.pending} pending
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {suggestions.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportDecisions}>
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={generateSuggestions}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Brain className="h-3 w-3 mr-1" />
                )}
                Analyze Names
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          
          {/* Analysis Status */}
          {isAnalyzing && (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Analyzing character names for potential merges...
              </p>
            </div>
          )}

          {/* Statistics */}
          {stats.total > 0 && !isAnalyzing && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-primary">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Suggestions</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-green-600">{stats.accepted}</p>
                <p className="text-xs text-muted-foreground">Accepted</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-red-600">{stats.rejected}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-blue-600">{stats.highConfidence}</p>
                <p className="text-xs text-muted-foreground">High Confidence</p>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {stats.pending > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={autoMode}
                    onCheckedChange={setAutoMode}
                  />
                  <span className="text-sm">Auto-accept high confidence (≥80%)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkApply}
                  disabled={stats.highConfidence === 0}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Apply {stats.highConfidence} High Confidence
                </Button>
              </div>
            </div>
          )}

          {/* Suggestions List */}
          {pendingSuggestions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Merge Suggestions</h4>
              <div className="space-y-3">
                {pendingSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <SuggestionCard
                      suggestion={suggestion}
                      onAccept={() => handleAccept(suggestion)}
                      onReject={() => handleReject(suggestion)}
                      autoMode={autoMode}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Applied/Rejected Suggestions Summary */}
          {(stats.accepted > 0 || stats.rejected > 0) && (
            <div className="space-y-3">
              <Separator />
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Decision Summary</h4>
                <Badge variant="outline">
                  {stats.accepted + stats.rejected} processed
                </Badge>
              </div>
              
              {stats.accepted > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ {stats.accepted} merge{stats.accepted !== 1 ? 's' : ''} applied - graph will update automatically
                  </p>
                </div>
              )}
              
              {stats.rejected > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    ❌ {stats.rejected} suggestion{stats.rejected !== 1 ? 's' : ''} rejected
                  </p>
                </div>
              )}
            </div>
          )}

          {/* No Suggestions */}
          {suggestions.length === 0 && !isAnalyzing && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-medium mb-1">No Analysis Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click "Analyze Names" to find potential character name merges
              </p>
              <Button onClick={generateSuggestions}>
                <Brain className="h-4 w-4 mr-2" />
                Start Analysis
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Individual suggestion card
 */
function SuggestionCard({
  suggestion,
  onAccept,
  onReject,
  autoMode
}: {
  suggestion: NameSuggestion
  onAccept: () => void
  onReject: () => void
  autoMode: boolean
}) {
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500'
    if (confidence >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium'
    return 'Low'
  }

  const getMergeTypeIcon = (type: string) => {
    switch (type) {
      case 'exact': return '='
      case 'prefix': return '⊃'
      case 'fuzzy': return '≈'
      case 'title': return '👤'
      default: return '?'
    }
  }

  return (
    <Card className="border-l-4" style={{ borderLeftColor: suggestion.confidence >= 0.8 ? '#10b981' : suggestion.confidence >= 0.6 ? '#f59e0b' : '#ef4444' }}>
      <CardContent className="pt-4">
        <div className="space-y-3">
          
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getMergeTypeIcon(suggestion.mergeType)}</span>
                <span className="font-medium">{suggestion.primaryName}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {suggestion.aliases.map(alias => (
                    <Badge key={alias} variant="outline" className="text-xs">
                      {alias}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {suggestion.reasoning}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={`${getConfidenceColor(suggestion.confidence)} text-white`}
              >
                {(suggestion.confidence * 100).toFixed(0)}% {getConfidenceText(suggestion.confidence)}
              </Badge>
            </div>
          </div>

          {/* Details */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{suggestion.characters.length} characters affected</span>
            <span>~{suggestion.estimatedMentions} total mentions</span>
            <span className="capitalize">{suggestion.mergeType} match</span>
          </div>

          {/* Character Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {suggestion.characters.map(char => (
              <div key={char.name} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span>{char.name}</span>
                <span className="text-muted-foreground">{char.mentions} mentions</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-3 w-3 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={onAccept}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-3 w-3 mr-1" />
              Accept Merge
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Analyze character names for potential merges
 */
function analyzeNameSimilarities(characters: Character[]): NameSuggestion[] {
  const suggestions: NameSuggestion[] = []
  const processed = new Set<string>()

  // Sort characters by mention count (descending) to prioritize important characters
  const sortedCharacters = [...characters].sort((a, b) => b.mentions - a.mentions)

  for (let i = 0; i < sortedCharacters.length; i++) {
    const char = sortedCharacters[i]
    if (processed.has(char.name)) continue

    const potentialMerges: Character[] = []
    const aliases: string[] = []

    // Look for potential merges
    for (let j = i + 1; j < sortedCharacters.length; j++) {
      const other = sortedCharacters[j]
      if (processed.has(other.name)) continue

      const similarity = calculateNameSimilarity(char.name, other.name)
      if (similarity.shouldMerge) {
        potentialMerges.push(other)
        aliases.push(other.name)
        processed.add(other.name)
      }
    }

    if (potentialMerges.length > 0) {
      // Choose primary name (usually the longer, more formal version)
      const allNames = [char.name, ...aliases]
      const primaryName = allNames.reduce((longest, current) => 
        current.length > longest.length ? current : longest
      )

      // Calculate confidence based on similarity strength and mention counts
      const avgSimilarity = aliases.reduce((sum, alias) => 
        sum + calculateNameSimilarity(primaryName, alias).confidence, 0
      ) / aliases.length

      const mentionWeight = Math.min((char.mentions + potentialMerges.reduce((sum, m) => sum + m.mentions, 0)) / 100, 1)
      const confidence = (avgSimilarity + mentionWeight) / 2

      const suggestion: NameSuggestion = {
        id: `merge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        primaryName,
        aliases: aliases.filter(alias => alias !== primaryName),
        confidence,
        reasoning: generateMergeReasoning(primaryName, aliases),
        characters: [char, ...potentialMerges],
        estimatedMentions: char.mentions + potentialMerges.reduce((sum, m) => sum + m.mentions, 0),
        mergeType: determineMergeType(primaryName, aliases[0])
      }

      suggestions.push(suggestion)
      processed.add(char.name)
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Calculate similarity between two names
 */
function calculateNameSimilarity(name1: string, name2: string): {
  shouldMerge: boolean
  confidence: number
  type: 'exact' | 'prefix' | 'fuzzy' | 'title'
} {
  const n1 = name1.toLowerCase().trim()
  const n2 = name2.toLowerCase().trim()

  // Exact match
  if (n1 === n2) {
    return { shouldMerge: true, confidence: 1.0, type: 'exact' }
  }

  // Title variations (Mr., Mrs., Dr., etc.)
  const titlePattern = /^(mr|mrs|ms|dr|prof|sir|lady|lord|miss|master)\.?\s+/i
  const n1NoTitle = n1.replace(titlePattern, '')
  const n2NoTitle = n2.replace(titlePattern, '')
  
  if (n1NoTitle === n2NoTitle && n1NoTitle.length > 0) {
    return { shouldMerge: true, confidence: 0.95, type: 'title' }
  }

  // Prefix matching (one name is a prefix of another)
  if (n1.startsWith(n2) || n2.startsWith(n1)) {
    const shorter = n1.length < n2.length ? n1 : n2
    const longer = n1.length >= n2.length ? n1 : n2
    
    // Only consider if the shorter name is at least 3 characters
    if (shorter.length >= 3 && longer.startsWith(shorter)) {
      const confidence = 0.7 + (shorter.length / longer.length) * 0.2
      return { shouldMerge: true, confidence, type: 'prefix' }
    }
  }

  // Fuzzy matching for similar names
  const similarity = calculateLevenshteinSimilarity(n1, n2)
  if (similarity >= 0.75 && Math.min(n1.length, n2.length) >= 4) {
    return { shouldMerge: true, confidence: similarity * 0.8, type: 'fuzzy' }
  }

  return { shouldMerge: false, confidence: 0, type: 'exact' }
}

/**
 * Calculate Levenshtein similarity (0-1 scale)
 */
function calculateLevenshteinSimilarity(str1: string, str2: string): number {
  const matrix: number[][] = []
  const len1 = str1.length
  const len2 = str2.length

  if (len1 === 0) return len2 === 0 ? 1 : 0
  if (len2 === 0) return 0

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  const distance = matrix[len1][len2]
  const maxLength = Math.max(len1, len2)
  return 1 - (distance / maxLength)
}

/**
 * Generate reasoning text for merge suggestion
 */
function generateMergeReasoning(primary: string, aliases: string[]): string {
  if (aliases.length === 0) return 'No aliases found'
  
  const alias = aliases[0]
  const similarity = calculateNameSimilarity(primary, alias)
  
  switch (similarity.type) {
    case 'exact':
      return 'Identical names found'
    case 'title':
      return 'Same name with/without title prefix'
    case 'prefix':
      return 'One name appears to be short form of the other'
    case 'fuzzy':
      return 'Names are very similar, likely spelling variations'
    default:
      return 'Similar names detected'
  }
}

/**
 * Determine merge type
 */
function determineMergeType(name1: string, name2: string): 'exact' | 'prefix' | 'fuzzy' | 'title' {
  const similarity = calculateNameSimilarity(name1, name2)
  return similarity.type
}
