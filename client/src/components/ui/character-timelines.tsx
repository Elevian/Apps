import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  TrendingUp, 
  BarChart3, 
  Download, 
  Zap,
  User,
  Users
} from 'lucide-react'
import { Character } from '@/lib/api/schemas'
import { ChapterMention } from '@/lib/insights/sentiment-analysis'
import * as d3 from 'd3-scale'

export interface TimelineData {
  character: Character
  mentions: ChapterMention[]
  totalMentions: number
  averageMentions: number
  peakChapter: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface CharacterTimelinesProps {
  characters: Character[]
  chapterMentions: Map<string, ChapterMention[]>
  selectedCharacter?: string
  onCharacterSelect?: (characterId: string) => void
  maxChapters?: number
  className?: string
}

export function CharacterTimelines({
  characters,
  chapterMentions,
  selectedCharacter,
  onCharacterSelect,
  maxChapters = 20,
  className
}: CharacterTimelinesProps) {
  
  // Process timeline data
  const timelineData = useMemo(() => {
    return characters.map(character => {
      const mentions = chapterMentions.get(character.name) || []
      const totalMentions = mentions.reduce((sum, m) => sum + m.mentions, 0)
      const averageMentions = mentions.length > 0 ? totalMentions / mentions.length : 0
      
      // Find peak chapter
      const peakChapter = mentions.reduce((peak, current) => 
        current.mentions > peak.mentions ? current : peak, 
        mentions[0] || { chapter: 1, mentions: 0 }
      ).chapter

      // Calculate trend
      const firstHalf = mentions.slice(0, Math.floor(mentions.length / 2))
      const secondHalf = mentions.slice(Math.floor(mentions.length / 2))
      const firstAvg = firstHalf.reduce((sum, m) => sum + m.mentions, 0) / firstHalf.length || 0
      const secondAvg = secondHalf.reduce((sum, m) => sum + m.mentions, 0) / secondHalf.length || 0
      
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
      if (secondAvg > firstAvg * 1.2) trend = 'increasing'
      else if (secondAvg < firstAvg * 0.8) trend = 'decreasing'

      return {
        character,
        mentions,
        totalMentions,
        averageMentions,
        peakChapter,
        trend
      }
    }).sort((a, b) => b.totalMentions - a.totalMentions)
  }, [characters, chapterMentions])

  // Top 3 characters for stacked area chart
  const topCharacters = timelineData.slice(0, 3)

  // Export timeline data
  const exportTimelines = () => {
    const csv = [
      'Character,Chapter,Mentions,Percentage',
      ...timelineData.flatMap(data => 
        data.mentions.map(mention => 
          `${data.character.name},${mention.chapter},${mention.mentions},${(mention.mentions / data.totalMentions * 100).toFixed(2)}`
        )
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'character-timelines.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <h3 className="text-lg font-medium">Character Timelines</h3>
          <Badge variant="secondary">{timelineData.length} characters</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={exportTimelines}>
          <Download className="h-3 w-3 mr-1" />
          Export CSV
        </Button>
      </div>

      {/* Stacked Area Chart for Top 3 Characters */}
      {topCharacters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Top Characters Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StackedAreaChart data={topCharacters} maxChapters={maxChapters} />
          </CardContent>
        </Card>
      )}

      {/* Individual Character Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {timelineData.map((data, index) => (
          <motion.div
            key={data.character.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <CharacterSparkline
              data={data}
              isSelected={selectedCharacter === data.character.name}
              onClick={() => onCharacterSelect?.(data.character.name)}
            />
          </motion.div>
        ))}
      </div>

      {/* Selected Character Detail */}
      {selectedCharacter && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <CharacterDetailTimeline
            data={timelineData.find(d => d.character.name === selectedCharacter)}
          />
        </motion.div>
      )}
    </div>
  )
}

/**
 * Individual character sparkline component
 */
function CharacterSparkline({
  data,
  isSelected,
  onClick
}: {
  data: TimelineData
  isSelected: boolean
  onClick: () => void
}) {
  const { character, mentions, totalMentions, averageMentions, peakChapter, trend } = data

  // Create sparkline path
  const sparklinePath = useMemo(() => {
    if (mentions.length === 0) return ''

    const width = 120
    const height = 40
    const maxMentions = Math.max(...mentions.map(m => m.mentions))
    
    if (maxMentions === 0) return ''

    const xScale = d3.scaleLinear()
      .domain([1, mentions.length])
      .range([0, width])

    const yScale = d3.scaleLinear()
      .domain([0, maxMentions])
      .range([height, 0])

    return mentions.map((mention, index) => {
      const x = xScale(index + 1)
      const y = yScale(mention.mentions)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
  }, [mentions])

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-600'
      case 'decreasing': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↗'
      case 'decreasing': return '↘'
      default: return '→'
    }
  }

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Character info */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4 className="font-medium text-sm truncate">{character.name}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{totalMentions} mentions</span>
                <span>•</span>
                <span className={getTrendColor(trend)}>
                  {getTrendIcon(trend)} {trend}
                </span>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              Peak: Ch.{peakChapter}
            </Badge>
          </div>

          {/* Sparkline */}
          <div className="relative">
            {sparklinePath ? (
              <svg width="120" height="40" className="w-full">
                <path
                  d={sparklinePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-primary"
                />
                {/* Dots for each point */}
                {mentions.map((mention, index) => {
                  const width = 120
                  const height = 40
                  const maxMentions = Math.max(...mentions.map(m => m.mentions))
                  const xScale = d3.scaleLinear().domain([1, mentions.length]).range([0, width])
                  const yScale = d3.scaleLinear().domain([0, maxMentions]).range([height, 0])
                  
                  return (
                    <circle
                      key={index}
                      cx={xScale(index + 1)}
                      cy={yScale(mention.mentions)}
                      r="2"
                      fill="currentColor"
                      className="text-primary"
                    />
                  )
                })}
              </svg>
            ) : (
              <div className="w-full h-[40px] flex items-center justify-center text-muted-foreground text-xs">
                No data
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Avg: {averageMentions.toFixed(1)}</span>
            <span>{mentions.length} chapters</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Stacked area chart for top characters
 */
function StackedAreaChart({
  data,
  maxChapters
}: {
  data: TimelineData[]
  maxChapters: number
}) {
  const chartData = useMemo(() => {
    // Create a complete chapter range
    const allChapters = Array.from({ length: maxChapters }, (_, i) => i + 1)
    
    return allChapters.map(chapter => {
      const chapterData: any = { chapter }
      let total = 0
      
      data.forEach(charData => {
        const mention = charData.mentions.find(m => m.chapter === chapter)
        const value = mention ? mention.mentions : 0
        chapterData[charData.character.name] = value
        total += value
      })
      
      chapterData.total = total
      return chapterData
    })
  }, [data, maxChapters])

  const colors = ['#3b82f6', '#ef4444', '#10b981']
  const width = 400
  const height = 200
  const margin = { top: 20, right: 30, bottom: 30, left: 40 }

  const xScale = d3.scaleLinear()
    .domain([1, maxChapters])
    .range([margin.left, width - margin.right])

  const maxTotal = Math.max(...chartData.map(d => d.total))
  const yScale = d3.scaleLinear()
    .domain([0, maxTotal])
    .range([height - margin.bottom, margin.top])

  // Create stacked areas
  const stackedData = data.map((charData, index) => {
    const points = chartData.map(d => {
      let y0 = 0
      for (let i = 0; i < index; i++) {
        y0 += d[data[i].character.name] || 0
      }
      const y1 = y0 + (d[charData.character.name] || 0)
      return {
        chapter: d.chapter,
        y0,
        y1,
        value: d[charData.character.name] || 0
      }
    })

    const pathData = [
      // Top line
      ...points.map(p => `${xScale(p.chapter)},${yScale(p.y1)}`),
      // Bottom line (reversed)
      ...points.reverse().map(p => `${xScale(p.chapter)},${yScale(p.y0)}`)
    ]

    return {
      character: charData.character.name,
      color: colors[index % colors.length],
      path: `M ${pathData.join(' L ')} Z`
    }
  })

  return (
    <div className="space-y-4">
      <svg width={width} height={height} className="w-full max-w-md">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
          <line
            key={ratio}
            x1={margin.left}
            x2={width - margin.right}
            y1={yScale(maxTotal * ratio)}
            y2={yScale(maxTotal * ratio)}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Stacked areas */}
        {stackedData.map((area, index) => (
          <path
            key={area.character}
            d={area.path}
            fill={area.color}
            fillOpacity="0.7"
            stroke={area.color}
            strokeWidth="1"
          />
        ))}

        {/* X-axis */}
        <line
          x1={margin.left}
          x2={width - margin.right}
          y1={height - margin.bottom}
          y2={height - margin.bottom}
          stroke="#374151"
          strokeWidth="1"
        />

        {/* Y-axis */}
        <line
          x1={margin.left}
          x2={margin.left}
          y1={margin.top}
          y2={height - margin.bottom}
          stroke="#374151"
          strokeWidth="1"
        />

        {/* Axis labels */}
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          className="text-xs fill-current"
        >
          Chapter
        </text>
        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90 15 ${height / 2})`}
          className="text-xs fill-current"
        >
          Mentions
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {data.map((charData, index) => (
          <div key={charData.character.name} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span>{charData.character.name}</span>
            <Badge variant="outline" className="text-xs">
              {charData.totalMentions}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Detailed timeline for selected character
 */
function CharacterDetailTimeline({
  data
}: {
  data?: TimelineData
}) {
  if (!data) return null

  const { character, mentions, totalMentions, trend } = data

  // Create detailed bar chart
  const maxMentions = Math.max(...mentions.map(m => m.mentions))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-4 w-4" />
          {character.name} - Chapter Analysis
          <Badge variant="secondary">{totalMentions} total mentions</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Character stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Mentions:</span>
            <div className="font-medium">{totalMentions}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Average/Chapter:</span>
            <div className="font-medium">{(totalMentions / mentions.length).toFixed(1)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Peak Chapter:</span>
            <div className="font-medium">
              {mentions.reduce((peak, current) => 
                current.mentions > peak.mentions ? current : peak, mentions[0]
              ).chapter}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Trend:</span>
            <div className="font-medium capitalize">{trend}</div>
          </div>
        </div>

        <Separator />

        {/* Detailed bar chart */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Mentions per Chapter</h4>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {mentions.map(mention => (
              <div key={mention.chapter} className="flex items-center gap-2 text-sm">
                <span className="w-16 text-muted-foreground">Ch. {mention.chapter}</span>
                <div className="flex-1 bg-muted rounded">
                  <div
                    className="bg-primary h-4 rounded flex items-center justify-end pr-2 text-xs text-primary-foreground"
                    style={{ 
                      width: `${(mention.mentions / maxMentions) * 100}%`,
                      minWidth: mention.mentions > 0 ? '20px' : '0px'
                    }}
                  >
                    {mention.mentions > 0 && mention.mentions}
                  </div>
                </div>
                <span className="w-12 text-right text-muted-foreground">
                  {((mention.mentions / totalMentions) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
