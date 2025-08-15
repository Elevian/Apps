import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ForceGraph2D from 'react-force-graph-2d'
import { graphOptimizer, type OptimizedGraphData } from '@/lib/performance/graph-optimization'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Play,
  Pause,
  Target,
  Users,
  Settings,
  FileImage,
  FileJson,
  Database,
  Maximize,
  Pin,
  PinOff
} from 'lucide-react'
import { GraphData, GraphNode, GraphEdge } from '@/lib/graph/co-occurrence'
import { NetworkMetrics } from '@/lib/analysis/network-metrics'
import { toast } from 'sonner'

export interface GraphMode {
  type: 'default' | 'ego' | 'community'
  selectedNode?: string
  egoDistance?: number
  communities?: Community[]
}

export interface Community {
  id: string
  nodes: string[]
  color: string
  size: number
  label?: string
}

export interface GraphControls {
  sentenceWindow: number
  minEdgeWeight: number
  showLabels: boolean
  pinNodes: boolean
  highlightNeighbors: boolean
  nodeSize: number
  linkWidth: number
  simulation: boolean
}

export interface EnhancedNetworkGraphProps {
  graphData: GraphData
  networkMetrics?: NetworkMetrics[]
  onNodeClick?: (node: GraphNode) => void
  onSettingsChange?: (controls: GraphControls) => void
  className?: string
}

// Community detection colors
const COMMUNITY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
  '#10AC84', '#EE5A24', '#0984E3', '#6C5CE7', '#A29BFE'
]

export function EnhancedNetworkGraph({
  graphData,
  networkMetrics = [],
  onNodeClick,
  onSettingsChange,
  className
}: EnhancedNetworkGraphProps) {
  const graphRef = useRef<any>()
  
  // Graph state
  const [graphMode, setGraphMode] = useState<GraphMode>({ type: 'default' })
  const [controls, setControls] = useState<GraphControls>({
    sentenceWindow: 3,
    minEdgeWeight: 2,
    showLabels: true,
    pinNodes: false,
    highlightNeighbors: true,
    nodeSize: 1,
    linkWidth: 1,
    simulation: true
  })
  
  // UI state
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [pinnedNodes, setPinnedNodes] = useState<Set<string>>(new Set())
  const [isControlsExpanded, setIsControlsExpanded] = useState(false)
  const [communities, setCommunities] = useState<Community[]>([])
  
  // Performance monitoring
  const [currentFPS, setCurrentFPS] = useState(60)
  const [renderLevel, setRenderLevel] = useState<'full' | 'medium' | 'minimal'>('full')
  const [optimizedGraphData, setOptimizedGraphData] = useState<OptimizedGraphData | null>(null)

  // Performance optimization and monitoring
  useEffect(() => {
    const handlePerformanceUpdate = (fps: number, shouldSimplify: boolean) => {
      setCurrentFPS(Math.round(fps))
      
      if (shouldSimplify && renderLevel === 'full') {
        setRenderLevel('medium')
        console.log('Switching to medium quality rendering for better performance')
      } else if (!shouldSimplify && renderLevel !== 'full' && fps > 55) {
        setRenderLevel('full')
        console.log('Switching back to full quality rendering')
      }
    }

    graphOptimizer.startPerformanceMonitoring(handlePerformanceUpdate)
    
    return () => {
      graphOptimizer.stopPerformanceMonitoring()
    }
  }, [renderLevel])

  // Optimize graph data for current render level
  useEffect(() => {
    if (graphData.nodes.length > 0) {
      const optimized = graphOptimizer.optimizeGraphData(
        { nodes: graphData.nodes, edges: graphData.edges },
        renderLevel
      )
      setOptimizedGraphData(optimized)
    }
  }, [graphData, renderLevel])

  // Apply filters and create filtered data
  const filteredData = React.useMemo(() => {
    if (!graphData.nodes.length) return { nodes: [], edges: [] }

    const filteredNodes = graphData.nodes.filter(node => {
      if (controls.minEdgeWeight > 1) {
        const nodeEdges = graphData.edges.filter(edge => 
          edge.source === node.id || edge.target === node.id
        )
        if (nodeEdges.length < controls.minEdgeWeight) return false
      }
      return true
    })

    const filteredEdges = graphData.edges.filter(edge => {
      const sourceExists = filteredNodes.some(n => n.id === edge.source)
      const targetExists = filteredNodes.some(n => n.id === edge.target)
      return sourceExists && targetExists && edge.weight >= controls.minEdgeWeight
    })

    return {
      nodes: filteredNodes,
      edges: filteredEdges
    }
  }, [graphData, controls.minEdgeWeight])

  // Update parent when controls change
  useEffect(() => {
    onSettingsChange?.(controls)
  }, [controls, onSettingsChange])

  // Calculate communities when switching to community mode
  useEffect(() => {
    if (graphMode.type === 'community' && communities.length === 0) {
      detectCommunities(graphData).then(setCommunities)
    }
  }, [graphMode.type, graphData, communities.length])

  /**
   * Get ego network (k-hop neighbors)
   */
  const getEgoNetwork = useCallback((
    data: GraphData, 
    centerNodeId: string, 
    distance: number
  ): { nodes: GraphNode[]; edges: GraphEdge[] } => {
    const visitedNodes = new Set<string>()
    const currentLevel = new Set([centerNodeId])
    
    // BFS to find nodes within distance
    for (let level = 0; level <= distance; level++) {
      const nextLevel = new Set<string>()
      
      currentLevel.forEach(nodeId => {
        visitedNodes.add(nodeId)
        
        if (level < distance) {
          // Find neighbors
          data.edges.forEach(edge => {
            if (edge.source === nodeId && !visitedNodes.has(edge.target)) {
              nextLevel.add(edge.target)
            } else if (edge.target === nodeId && !visitedNodes.has(edge.source)) {
              nextLevel.add(edge.source)
            }
          })
        }
      })
      
      currentLevel.clear()
      nextLevel.forEach(id => currentLevel.add(id))
    }
    
    const egoNodes = data.nodes.filter(node => visitedNodes.has(node.id))
    const egoEdges = data.edges.filter(edge => 
      visitedNodes.has(edge.source) && visitedNodes.has(edge.target)
    )
    
    return { nodes: egoNodes, edges: egoEdges }
  }, [])

  /**
   * Handle node click
   */
  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node.id)
    onNodeClick?.(node)
    
    // Toggle ego mode
    if (graphMode.type === 'ego' && graphMode.selectedNode === node.id) {
      setGraphMode({ type: 'default' })
    } else {
      setGraphMode({ 
        type: 'ego', 
        selectedNode: node.id, 
        egoDistance: 1 
      })
    }
  }, [graphMode, onNodeClick])

  /**
   * Handle node hover
   */
  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node?.id || null)
  }, [])

  /**
   * Pin/unpin node
   */
  const toggleNodePin = useCallback((nodeId: string) => {
    setPinnedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }, [])

  /**
   * Get node rendering properties
   */
  const getNodeProps = useCallback((node: any) => {
    const baseSize = 4 + (node.size || 0) * controls.nodeSize
    const isHovered = hoveredNode === node.id
    const isSelected = selectedNode === node.id
    const isPinned = pinnedNodes.has(node.id)
    
    // Highlight neighbors if enabled
    const shouldHighlight = controls.highlightNeighbors && hoveredNode && (
      node.id === hoveredNode ||
      filteredData.edges.some(edge => 
        (edge.source === hoveredNode && edge.target === node.id) ||
        (edge.target === hoveredNode && edge.source === node.id)
      )
    )

    return {
      size: isHovered || isSelected ? baseSize * 1.5 : baseSize,
      color: shouldHighlight ? '#ff6b6b' : (node.color || '#8b5cf6'),
      opacity: hoveredNode && !shouldHighlight ? 0.3 : 1,
      strokeWidth: isPinned ? 3 : (isSelected ? 2 : 0),
      strokeColor: isPinned ? '#f59e0b' : (isSelected ? '#3b82f6' : 'transparent')
    }
  }, [hoveredNode, selectedNode, pinnedNodes, controls, filteredData.edges])

  /**
   * Get edge rendering properties
   */
  const getEdgeProps = useCallback((edge: any) => {
    const isHighlighted = controls.highlightNeighbors && hoveredNode && (
      edge.source === hoveredNode || edge.target === hoveredNode
    )
    
    return {
      width: Math.sqrt(edge.weight) * controls.linkWidth,
      color: isHighlighted ? '#ff6b6b' : '#8b5cf6',
      opacity: hoveredNode && !isHighlighted ? 0.1 : 0.6
    }
  }, [hoveredNode, controls])

  /**
   * Export functions
   */
  const exportPNG = useCallback(() => {
    if (graphRef.current) {
      const canvas = graphRef.current.renderer().domElement
      const link = document.createElement('a')
      link.download = 'character-network.png'
      link.href = canvas.toDataURL()
      link.click()
      toast.success('Graph exported as PNG')
    }
  }, [])

  const exportJSON = useCallback(() => {
    const data = JSON.stringify(filteredData, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'character-network.json'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Graph exported as JSON')
  }, [filteredData])

  const exportCSV = useCallback(() => {
    const edgesCsv = [
      'Source,Target,Weight,Type',
      ...filteredData.edges.map(edge => 
        `${edge.source},${edge.target},${edge.weight},undirected`
      )
    ].join('\n')

    const nodesCsv = [
      'Id,Label,Size,Community',
      ...filteredData.nodes.map(node => 
        `${node.id},${node.name},${node.size || 1},${(node as any).community || ''}`
      )
    ].join('\n')

    const fullCsv = 'EDGES\n' + edgesCsv + '\n\nNODES\n' + nodesCsv

    const blob = new Blob([fullCsv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'character-network.csv'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Graph exported as CSV')
  }, [filteredData])

  const exportGEXF = useCallback(() => {
    const gexf = generateGEXF(filteredData, networkMetrics)
    const blob = new Blob([gexf], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'character-network.gexf'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Graph exported as GEXF for Gephi')
  }, [filteredData, networkMetrics])

  /**
   * Layout controls
   */
  const fitToView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400)
    }
  }, [])

  const resetLayout = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.d3ReheatSimulation()
    }
  }, [])

  const pauseSimulation = useCallback(() => {
    setControls(prev => ({ ...prev, simulation: !prev.simulation }))
  }, [])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Graph Modes Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Graph Mode:</span>
              <div className="flex items-center gap-1">
                <Button
                  variant={graphMode.type === 'default' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGraphMode({ type: 'default' })}
                >
                  Default
                </Button>
                <Button
                  variant={graphMode.type === 'ego' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => graphMode.type === 'ego' 
                    ? setGraphMode({ type: 'default' })
                    : setGraphMode({ type: 'ego', selectedNode: selectedNode || filteredData.nodes[0]?.id, egoDistance: 1 })
                  }
                >
                  <Target className="h-3 w-3 mr-1" />
                  Ego View
                </Button>
                <Button
                  variant={graphMode.type === 'community' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGraphMode({ type: 'community' })}
                >
                  <Users className="h-3 w-3 mr-1" />
                  Communities
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Graph Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{filteredData.nodes.length} nodes</span>
                <span>{filteredData.edges.length} edges</span>
                {graphMode.type === 'ego' && (
                  <Badge variant="secondary">
                    {graphMode.egoDistance}-hop from {graphMode.selectedNode}
                  </Badge>
                )}
                {graphMode.type === 'community' && (
                  <Badge variant="secondary">
                    {communities.length} communities
                  </Badge>
                )}
              </div>

              {/* Controls Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsControlsExpanded(!isControlsExpanded)}
              >
                <Settings className="h-3 w-3 mr-1" />
                Controls
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graph Container */}
      <div className="relative">
        {/* Main Graph */}
        <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-background">
          {filteredData.nodes.length > 0 ? (
            <ForceGraph2D
              ref={graphRef}
              graphData={{
                nodes: filteredData.nodes,
                links: filteredData.edges
              }}
              width={undefined}
              height={600}
              backgroundColor="transparent"
              
              // Node configuration
              nodeId="id"
              nodeLabel={controls.showLabels ? "name" : undefined}
              nodeVal={(node: any) => getNodeProps(node).size}
              nodeColor={(node: any) => getNodeProps(node).color}
              
              // Link configuration
              linkSource="source"
              linkTarget="target"
              linkWidth={(link: any) => getEdgeProps(link).width}
              linkColor={(link: any) => getEdgeProps(link).color}
              
              // Events
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
              onNodeRightClick={(node: any, event: any) => {
                event.preventDefault()
                toggleNodePin(node.id)
              }}
              
              // Simulation
              d3AlphaDecay={controls.simulation ? 0.0228 : 1}
              d3VelocityDecay={controls.simulation ? 0.4 : 1}
              
              // Physics
              warmupTicks={100}
              cooldownTicks={controls.simulation ? 0 : Infinity}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <Users className="h-12 w-12 mx-auto" />
                <p>No character relationships found</p>
                <p className="text-sm">Try adjusting the minimum edge weight</p>
              </div>
            </div>
          )}
        </div>

        {/* Layout Controls Overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button variant="outline" size="sm" onClick={fitToView}>
            <Maximize className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetLayout}>
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={pauseSimulation}
          >
            {controls.simulation ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
        </div>

        {/* Node Info Overlay */}
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 bg-background border rounded-lg p-3 shadow-lg max-w-xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{filteredData.nodes.find(n => n.id === selectedNode)?.name}</h4>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleNodePin(selectedNode)}
                  >
                    {pinnedNodes.has(selectedNode) ? 
                      <PinOff className="h-3 w-3" /> : 
                      <Pin className="h-3 w-3" />
                    }
                  </Button>
                </div>
              </div>
              
              {networkMetrics.find(m => m.nodeId === selectedNode) && (
                <div className="text-xs space-y-1">
                  <div>Degree: {networkMetrics.find(m => m.nodeId === selectedNode)?.degree}</div>
                  <div>Betweenness: {networkMetrics.find(m => m.nodeId === selectedNode)?.betweennessCentrality.toFixed(3)}</div>
                  <div>PageRank: {networkMetrics.find(m => m.nodeId === selectedNode)?.pageRank.toFixed(3)}</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Inline Controls Panel */}
      <AnimatePresence>
        {isControlsExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Graph Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Sentence Window: {controls.sentenceWindow}
                    </label>
                    <Slider
                      value={[controls.sentenceWindow]}
                      onValueChange={([value]) => 
                        setControls(prev => ({ ...prev, sentenceWindow: value }))
                      }
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Min Edge Weight: {controls.minEdgeWeight}
                    </label>
                    <Slider
                      value={[controls.minEdgeWeight]}
                      onValueChange={([value]) => 
                        setControls(prev => ({ ...prev, minEdgeWeight: value }))
                      }
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Node Size: {controls.nodeSize.toFixed(1)}
                    </label>
                    <Slider
                      value={[controls.nodeSize]}
                      onValueChange={([value]) => 
                        setControls(prev => ({ ...prev, nodeSize: value }))
                      }
                      min={0.5}
                      max={3}
                      step={0.1}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Link Width: {controls.linkWidth.toFixed(1)}
                    </label>
                    <Slider
                      value={[controls.linkWidth]}
                      onValueChange={([value]) => 
                        setControls(prev => ({ ...prev, linkWidth: value }))
                      }
                      min={0.5}
                      max={3}
                      step={0.1}
                    />
                  </div>
                </div>

                <Separator />

                {/* Toggles */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={controls.showLabels}
                      onCheckedChange={(checked) => 
                        setControls(prev => ({ ...prev, showLabels: checked }))
                      }
                    />
                    <label className="text-sm">Show Labels</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={controls.pinNodes}
                      onCheckedChange={(checked) => 
                        setControls(prev => ({ ...prev, pinNodes: checked }))
                      }
                    />
                    <label className="text-sm">Pin Nodes</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={controls.highlightNeighbors}
                      onCheckedChange={(checked) => 
                        setControls(prev => ({ ...prev, highlightNeighbors: checked }))
                      }
                    />
                    <label className="text-sm">Highlight Neighbors</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={controls.simulation}
                      onCheckedChange={(checked) => 
                        setControls(prev => ({ ...prev, simulation: checked }))
                      }
                    />
                    <label className="text-sm">Physics</label>
                  </div>
                </div>

                <Separator />

                {/* Export Buttons */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Export Options</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={exportPNG}>
                      <FileImage className="h-3 w-3 mr-1" />
                      PNG
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportJSON}>
                      <FileJson className="h-3 w-3 mr-1" />
                      JSON
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportCSV}>
                      <Database className="h-3 w-3 mr-1" />
                      CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportGEXF}>
                      <Download className="h-3 w-3 mr-1" />
                      GEXF (Gephi)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Community Legend */}
      {graphMode.type === 'community' && communities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Communities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {communities.map((community, index) => (
                <div key={community.id} className="flex items-center gap-2 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: community.color }}
                  />
                  <span>Community {index + 1} ({community.size} nodes)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Community detection using label propagation
 */
async function detectCommunities(graphData: GraphData): Promise<Community[]> {
  // Simple label propagation algorithm
  const nodes = [...graphData.nodes]
  const edges = [...graphData.edges]
  
  // Initialize each node with its own label
  const labels = new Map(nodes.map(node => [node.id, node.id]))
  const maxIterations = 50
  
  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false
    
    // Shuffle nodes for randomness
    const shuffledNodes = [...nodes].sort(() => Math.random() - 0.5)
    
    for (const node of shuffledNodes) {
      // Count neighbor labels
      const neighborLabels = new Map<string, number>()
      
      edges.forEach(edge => {
        let neighborId: string | null = null
        if (edge.source === node.id) neighborId = edge.target
        else if (edge.target === node.id) neighborId = edge.source
        
        if (neighborId) {
          const label = labels.get(neighborId)!
          neighborLabels.set(label, (neighborLabels.get(label) || 0) + edge.weight)
        }
      })
      
      // Choose most frequent neighbor label
      if (neighborLabels.size > 0) {
        const bestLabel = Array.from(neighborLabels.entries())
          .sort((a, b) => b[1] - a[1])[0][0]
        
        if (labels.get(node.id) !== bestLabel) {
          labels.set(node.id, bestLabel)
          changed = true
        }
      }
    }
    
    if (!changed) break
  }
  
  // Group nodes by label
  const communityGroups = new Map<string, string[]>()
  labels.forEach((label, nodeId) => {
    if (!communityGroups.has(label)) {
      communityGroups.set(label, [])
    }
    communityGroups.get(label)!.push(nodeId)
  })
  
  // Create community objects
  const communities: Community[] = []
  let colorIndex = 0
  
  communityGroups.forEach((nodeIds, label) => {
    if (nodeIds.length > 1) { // Only communities with multiple nodes
      communities.push({
        id: label,
        nodes: nodeIds,
        color: COMMUNITY_COLORS[colorIndex % COMMUNITY_COLORS.length],
        size: nodeIds.length
      })
      colorIndex++
    }
  })
  
  return communities
}

/**
 * Generate GEXF format for Gephi
 */
function generateGEXF(graphData: GraphData, networkMetrics: NetworkMetrics[]): string {
  const gexf = `<?xml version="1.0" encoding="UTF-8"?>
<gexf xmlns="http://www.gexf.net/1.2draft" version="1.2">
  <meta lastmodifieddate="${new Date().toISOString()}">
    <creator>Gutenberg Character Analysis</creator>
    <description>Character network from literary text</description>
  </meta>
  <graph mode="static" defaultedgetype="undirected">
    <attributes class="node">
      <attribute id="0" title="degree" type="integer"/>
      <attribute id="1" title="betweenness" type="double"/>
      <attribute id="2" title="eigenvector" type="double"/>
      <attribute id="3" title="pagerank" type="double"/>
    </attributes>
    <nodes>
      ${graphData.nodes.map(node => {
        const metrics = networkMetrics.find(m => m.nodeId === node.id)
        return `<node id="${node.id}" label="${node.name}">
          <attvalues>
            <attvalue for="0" value="${metrics?.degree || 0}"/>
            <attvalue for="1" value="${metrics?.betweennessCentrality || 0}"/>
            <attvalue for="2" value="${metrics?.eigenvectorCentrality || 0}"/>
            <attvalue for="3" value="${metrics?.pageRank || 0}"/>
          </attvalues>
        </node>`
      }).join('\n      ')}
    </nodes>
    <edges>
      ${graphData.edges.map((edge, index) => 
        `<edge id="${index}" source="${edge.source}" target="${edge.target}" weight="${edge.weight}"/>`
      ).join('\n      ')}
    </edges>
  </graph>
</gexf>`

  return gexf
}
