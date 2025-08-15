import React from 'react'
import { useTranslation } from 'react-i18next'
import { useRTL } from '@/components/ui/language-switcher'

export interface RTLChartWrapperProps {
  children: React.ReactNode
  className?: string
  preserveTextDirection?: boolean
  flipHorizontally?: boolean
}

/**
 * Wrapper component that makes charts RTL-friendly
 */
export function RTLChartWrapper({
  children,
  className = '',
  preserveTextDirection = true,
  flipHorizontally = true
}: RTLChartWrapperProps) {
  const { isRTL } = useRTL()

  if (!isRTL) {
    return <div className={className}>{children}</div>
  }

  return (
    <div 
      className={`rtl-chart-container ${className}`}
      style={{
        transform: flipHorizontally ? 'scaleX(-1)' : undefined,
        direction: 'rtl'
      }}
    >
      <div
        className="rtl-chart-content"
        style={{
          transform: preserveTextDirection && flipHorizontally ? 'scaleX(-1)' : undefined
        }}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * RTL-aware Force Graph wrapper
 */
export function RTLForceGraphWrapper({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  const { isRTL } = useRTL()

  return (
    <div 
      className={`force-graph-container ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {children}
    </div>
  )
}

/**
 * RTL-aware D3 chart configuration
 */
export function useRTLChartConfig() {
  const { isRTL } = useRTL()

  return {
    isRTL,
    textAnchor: isRTL ? 'end' : 'start',
    textDirection: isRTL ? 'rtl' : 'ltr',
    transformOrigin: isRTL ? 'right' : 'left',
    xAxisOrientation: isRTL ? 'right' : 'left',
    yAxisOrientation: 'left', // Y-axis typically stays on left
    
    // Scale adjustments for RTL
    scaleTransform: (scale: any) => {
      if (!isRTL) return scale
      
      // For linear scales, we might need to flip the range
      if (scale.range) {
        const range = scale.range()
        return scale.range([range[1], range[0]])
      }
      
      return scale
    },
    
    // Text positioning helpers
    getTextX: (defaultX: number, width: number) => {
      return isRTL ? width - defaultX : defaultX
    },
    
    getTextAlign: (defaultAlign: string) => {
      if (!isRTL) return defaultAlign
      
      switch (defaultAlign) {
        case 'start': return 'end'
        case 'end': return 'start'
        case 'left': return 'right'
        case 'right': return 'left'
        default: return defaultAlign
      }
    }
  }
}

/**
 * RTL-aware positioning utilities for charts
 */
export const rtlChartUtils = {
  /**
   * Get RTL-aware margin configuration
   */
  getMargins: (margins: { top: number; right: number; bottom: number; left: number }, isRTL: boolean) => {
    if (!isRTL) return margins
    
    return {
      top: margins.top,
      right: margins.left,  // Swap left and right
      bottom: margins.bottom,
      left: margins.right
    }
  },

  /**
   * Get RTL-aware legend position
   */
  getLegendPosition: (position: string, isRTL: boolean) => {
    if (!isRTL) return position
    
    switch (position) {
      case 'top-left': return 'top-right'
      case 'top-right': return 'top-left'
      case 'bottom-left': return 'bottom-right'
      case 'bottom-right': return 'bottom-left'
      case 'left': return 'right'
      case 'right': return 'left'
      default: return position
    }
  },

  /**
   * Get RTL-aware tooltip positioning
   */
  getTooltipPosition: (x: number, y: number, chartWidth: number, isRTL: boolean) => {
    if (!isRTL) return { x, y }
    
    return {
      x: chartWidth - x,
      y
    }
  },

  /**
   * Transform SVG text elements for RTL
   */
  transformTextElement: (element: SVGTextElement, isRTL: boolean) => {
    if (!isRTL) return
    
    // Flip text horizontally while keeping it readable
    element.style.transform = 'scaleX(-1)'
    element.style.textAnchor = element.style.textAnchor === 'start' ? 'end' : 'start'
  }
}

/**
 * Hook for RTL-aware chart animations
 */
export function useRTLChartAnimations() {
  const { isRTL } = useRTL()

  return {
    slideInFromLeft: {
      initial: { x: isRTL ? 100 : -100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: isRTL ? 100 : -100, opacity: 0 }
    },
    slideInFromRight: {
      initial: { x: isRTL ? -100 : 100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: isRTL ? -100 : 100, opacity: 0 }
    },
    expandFromLeft: {
      initial: { scaleX: 0, transformOrigin: isRTL ? 'right' : 'left' },
      animate: { scaleX: 1 },
      exit: { scaleX: 0 }
    }
  }
}
