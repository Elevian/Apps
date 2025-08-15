import React from 'react'

export interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  fillColor?: string
  strokeWidth?: number
  className?: string
  showDots?: boolean
  animated?: boolean
}

export function Sparkline({
  data,
  width = 120,
  height = 30,
  color = '#8b5cf6',
  fillColor = '#8b5cf6',
  strokeWidth = 1.5,
  className = '',
  showDots = false,
  animated = true
}: SparklineProps) {
  if (data.length === 0) {
    return (
      <svg width={width} height={height} className={className}>
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="#e5e7eb"
          strokeWidth={1}
          strokeDasharray="2,2"
        />
      </svg>
    )
  }

  const maxValue = Math.max(...data)
  const minValue = Math.min(...data)
  const range = maxValue - minValue || 1

  // Calculate points
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - minValue) / range) * height
    return { x, y, value }
  })

  // Create path for line
  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  // Create path for area fill
  const areaPathData = [
    pathData,
    `L ${width} ${height}`,
    `L 0 ${height}`,
    'Z'
  ].join(' ')

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      {/* Area fill */}
      <path
        d={areaPathData}
        fill={`${fillColor}20`} // 20% opacity
        stroke="none"
      />
      
      {/* Main line */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? 'animate-pulse' : ''}
      />

      {/* Data points */}
      {showDots && points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={1.5}
          fill={color}
          className={animated ? 'animate-pulse' : ''}
        />
      ))}

      {/* Highlight max value */}
      {points.length > 0 && (() => {
        const maxPoint = points.find(p => p.value === maxValue)
        return maxPoint ? (
          <circle
            cx={maxPoint.x}
            cy={maxPoint.y}
            r={2}
            fill={color}
            stroke="white"
            strokeWidth={1}
          />
        ) : null
      })()}
    </svg>
  )
}

export interface TrendSparklineProps extends Omit<SparklineProps, 'data'> {
  data: Array<{ label: string; value: number }>
  showLabels?: boolean
}

export function TrendSparkline({
  data,
  showLabels = false,
  ...sparklineProps
}: TrendSparklineProps) {
  const values = data.map(d => d.value)
  
  if (showLabels) {
    return (
      <div className="space-y-1">
        <Sparkline data={values} {...sparklineProps} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{data[0]?.label}</span>
          <span>{data[data.length - 1]?.label}</span>
        </div>
      </div>
    )
  }
  
  return <Sparkline data={values} {...sparklineProps} />
}

export interface ChapterSparklineProps {
  mentions: Array<{ chapter: number; mentions: number }>
  characterName: string
  width?: number
  height?: number
  className?: string
}

export function ChapterSparkline({
  mentions,
  characterName,
  width = 100,
  height = 25,
  className = ''
}: ChapterSparklineProps) {
  const values = mentions.map(m => m.mentions)
  const totalMentions = values.reduce((sum, val) => sum + val, 0)
  const maxMentions = Math.max(...values)
  
  if (totalMentions === 0) {
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        No mentions
      </div>
    )
  }
  
  return (
    <div className={`space-y-1 ${className}`}>
      <Sparkline
        data={values}
        width={width}
        height={height}
        color="#6366f1"
        fillColor="#6366f1"
        strokeWidth={1.5}
        animated={false}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Ch.1</span>
        <span className="font-medium">
          {totalMentions} total
        </span>
        <span>Ch.{mentions.length}</span>
      </div>
    </div>
  )
}
