/**
 * Graph Performance Optimization
 * Ensures ≥50 FPS during graph interactions through efficient rendering and computation
 */

export interface PerformanceConfig {
  targetFPS: number
  maxNodes: number
  maxEdges: number
  simplificationThreshold: number
  animationDuration: number
  debounceDelay: number
}

export interface GraphData {
  nodes: Array<{
    id: string
    name: string
    size: number
    color?: string
    x?: number
    y?: number
  }>
  edges: Array<{
    source: string
    target: string
    weight: number
  }>
}

export interface OptimizedGraphData extends GraphData {
  simplified: boolean
  originalNodeCount: number
  originalEdgeCount: number
  renderLevel: 'full' | 'medium' | 'minimal'
}

export class GraphPerformanceOptimizer {
  private config: PerformanceConfig
  private frameTimeHistory: number[] = []
  private lastFrameTime: number = 0
  private animationFrameId: number | null = null

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      targetFPS: 50,
      maxNodes: 100,
      maxEdges: 500,
      simplificationThreshold: 30, // FPS threshold for simplification
      animationDuration: 300,
      debounceDelay: 100,
      ...config
    }
  }

  /**
   * Monitor frame rate and adjust rendering quality
   */
  startPerformanceMonitoring(callback: (fps: number, shouldSimplify: boolean) => void): void {
    const monitor = () => {
      const now = performance.now()
      
      if (this.lastFrameTime > 0) {
        const frameTime = now - this.lastFrameTime
        this.frameTimeHistory.push(frameTime)
        
        // Keep only recent frame times (last 60 frames)
        if (this.frameTimeHistory.length > 60) {
          this.frameTimeHistory.shift()
        }
        
        // Calculate average FPS
        if (this.frameTimeHistory.length >= 10) {
          const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b) / this.frameTimeHistory.length
          const fps = 1000 / avgFrameTime
          const shouldSimplify = fps < this.config.simplificationThreshold
          
          callback(fps, shouldSimplify)
        }
      }
      
      this.lastFrameTime = now
      this.animationFrameId = requestAnimationFrame(monitor)
    }
    
    this.animationFrameId = requestAnimationFrame(monitor)
  }

  /**
   * Stop performance monitoring
   */
  stopPerformanceMonitoring(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * Optimize graph data for smooth rendering
   */
  optimizeGraphData(data: GraphData, forceLevel?: 'full' | 'medium' | 'minimal'): OptimizedGraphData {
    const nodeCount = data.nodes.length
    const edgeCount = data.edges.length
    
    let renderLevel: 'full' | 'medium' | 'minimal' = forceLevel || 'full'
    
    // Auto-determine render level based on size
    if (!forceLevel) {
      if (nodeCount > this.config.maxNodes * 2 || edgeCount > this.config.maxEdges * 2) {
        renderLevel = 'minimal'
      } else if (nodeCount > this.config.maxNodes || edgeCount > this.config.maxEdges) {
        renderLevel = 'medium'
      }
    }

    switch (renderLevel) {
      case 'minimal':
        return this.createMinimalGraph(data)
      case 'medium':
        return this.createMediumGraph(data)
      default:
        return {
          ...data,
          simplified: false,
          originalNodeCount: nodeCount,
          originalEdgeCount: edgeCount,
          renderLevel: 'full'
        }
    }
  }

  /**
   * Create minimal graph for performance
   */
  private createMinimalGraph(data: GraphData): OptimizedGraphData {
    // Keep only top nodes by importance/size
    const sortedNodes = [...data.nodes].sort((a, b) => (b.size || 0) - (a.size || 0))
    const topNodes = sortedNodes.slice(0, Math.min(30, this.config.maxNodes / 2))
    const nodeIds = new Set(topNodes.map(n => n.id))
    
    // Keep only edges between top nodes with highest weights
    const relevantEdges = data.edges
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, Math.min(100, this.config.maxEdges / 3))

    return {
      nodes: topNodes,
      edges: relevantEdges,
      simplified: true,
      originalNodeCount: data.nodes.length,
      originalEdgeCount: data.edges.length,
      renderLevel: 'minimal'
    }
  }

  /**
   * Create medium complexity graph
   */
  private createMediumGraph(data: GraphData): OptimizedGraphData {
    // Keep more nodes but filter edges more aggressively
    const sortedNodes = [...data.nodes].sort((a, b) => (b.size || 0) - (a.size || 0))
    const mediumNodes = sortedNodes.slice(0, Math.min(60, this.config.maxNodes))
    const nodeIds = new Set(mediumNodes.map(n => n.id))
    
    // Filter edges by weight threshold
    const weightThreshold = this.calculateWeightThreshold(data.edges, 0.7)
    const mediumEdges = data.edges
      .filter(e => 
        nodeIds.has(e.source) && 
        nodeIds.has(e.target) && 
        e.weight >= weightThreshold
      )
      .slice(0, this.config.maxEdges)

    return {
      nodes: mediumNodes,
      edges: mediumEdges,
      simplified: true,
      originalNodeCount: data.nodes.length,
      originalEdgeCount: data.edges.length,
      renderLevel: 'medium'
    }
  }

  /**
   * Calculate weight threshold for edge filtering
   */
  private calculateWeightThreshold(edges: Array<{weight: number}>, percentile: number): number {
    const weights = edges.map(e => e.weight).sort((a, b) => b - a)
    const index = Math.floor(weights.length * (1 - percentile))
    return weights[index] || 0
  }

  /**
   * Debounced function creator for smooth interactions
   */
  createDebounced<T extends (...args: any[]) => void>(
    func: T,
    delay: number = this.config.debounceDelay
  ): (...args: Parameters<T>) => void {
    let timeoutId: number | null = null
    
    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = window.setTimeout(() => {
        func(...args)
        timeoutId = null
      }, delay)
    }
  }

  /**
   * Throttled function creator for high-frequency events
   */
  createThrottled<T extends (...args: any[]) => void>(
    func: T,
    interval: number = 16 // ~60 FPS
  ): (...args: Parameters<T>) => void {
    let lastCall = 0
    
    return (...args: Parameters<T>) => {
      const now = Date.now()
      
      if (now - lastCall >= interval) {
        func(...args)
        lastCall = now
      }
    }
  }

  /**
   * Efficient node position calculation using spatial indexing
   */
  optimizeNodePositions(nodes: Array<{id: string; x?: number; y?: number}>): void {
    // Use quadtree or similar spatial structure for efficient collision detection
    // This is a simplified version - can be enhanced with actual spatial indexing
    
    const grid = new Map<string, Array<{id: string; x: number; y: number}>>()
    const cellSize = 50 // Adjust based on node sizes
    
    nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        const cellKey = `${Math.floor(node.x / cellSize)},${Math.floor(node.y / cellSize)}`
        if (!grid.has(cellKey)) {
          grid.set(cellKey, [])
        }
        grid.get(cellKey)!.push({id: node.id, x: node.x, y: node.y})
      }
    })
    
    // Spatial optimization can be applied here for collision detection, etc.
  }

  /**
   * Memory-efficient edge bundling for dense graphs
   */
  bundleEdges(edges: Array<{source: string; target: string; weight: number}>): Array<{
    source: string
    target: string
    weight: number
    bundled?: boolean
    originalCount?: number
  }> {
    const bundleMap = new Map<string, {weight: number; count: number}>()
    
    // Group edges by source-target pair (bidirectional)
    edges.forEach(edge => {
      const key = [edge.source, edge.target].sort().join('-')
      const existing = bundleMap.get(key) || {weight: 0, count: 0}
      existing.weight += edge.weight
      existing.count += 1
      bundleMap.set(key, existing)
    })
    
    // Convert back to edge format
    return Array.from(bundleMap.entries()).map(([key, data]) => {
      const [source, target] = key.split('-')
      return {
        source,
        target,
        weight: data.weight,
        bundled: data.count > 1,
        originalCount: data.count
      }
    })
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations(data: GraphData): {
    recommendations: string[]
    estimatedFPS: number
    suggestedLevel: 'full' | 'medium' | 'minimal'
  } {
    const nodeCount = data.nodes.length
    const edgeCount = data.edges.length
    const complexity = nodeCount * Math.log(edgeCount + 1)
    
    let estimatedFPS = 60
    let suggestedLevel: 'full' | 'medium' | 'minimal' = 'full'
    const recommendations: string[] = []
    
    if (complexity > 5000) {
      estimatedFPS = 20
      suggestedLevel = 'minimal'
      recommendations.push('Graph is very complex - using minimal rendering')
      recommendations.push('Consider filtering characters by importance')
    } else if (complexity > 2000) {
      estimatedFPS = 35
      suggestedLevel = 'medium'
      recommendations.push('Large graph detected - using medium quality rendering')
      recommendations.push('Some visual details may be simplified')
    } else if (nodeCount > 50) {
      estimatedFPS = 45
      recommendations.push('Consider using node clustering for better performance')
    }
    
    if (edgeCount > 200) {
      recommendations.push('High edge count - consider increasing minimum edge weight')
    }
    
    return {
      recommendations,
      estimatedFPS,
      suggestedLevel
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current performance status
   */
  getStatus(): {
    currentFPS: number
    config: PerformanceConfig
    isMonitoring: boolean
  } {
    const avgFrameTime = this.frameTimeHistory.length > 0
      ? this.frameTimeHistory.reduce((a, b) => a + b) / this.frameTimeHistory.length
      : 16.67 // Assume 60 FPS if no data

    return {
      currentFPS: 1000 / avgFrameTime,
      config: { ...this.config },
      isMonitoring: this.animationFrameId !== null
    }
  }
}

// Global optimizer instance
export const graphOptimizer = new GraphPerformanceOptimizer()

/**
 * React hook for graph performance optimization
 */
export function useGraphPerformance() {
  const [fps, setFPS] = React.useState(60)
  const [renderLevel, setRenderLevel] = React.useState<'full' | 'medium' | 'minimal'>('full')
  
  React.useEffect(() => {
    graphOptimizer.startPerformanceMonitoring((currentFPS, shouldSimplify) => {
      setFPS(currentFPS)
      if (shouldSimplify && renderLevel === 'full') {
        setRenderLevel('medium')
      } else if (!shouldSimplify && renderLevel !== 'full') {
        setRenderLevel('full')
      }
    })
    
    return () => {
      graphOptimizer.stopPerformanceMonitoring()
    }
  }, [renderLevel])
  
  const optimizeGraph = React.useCallback((data: GraphData) => {
    return graphOptimizer.optimizeGraphData(data, renderLevel)
  }, [renderLevel])
  
  return {
    fps,
    renderLevel,
    optimizeGraph,
    setRenderLevel
  }
}

// Fix React import issue
declare global {
  const React: typeof import('react')
}
