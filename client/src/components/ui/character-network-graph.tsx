import { useEffect, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { 
  Network, 
 
  Maximize2, 
  Settings, 
  Eye, 
  EyeOff,
  RotateCcw
} from 'lucide-react'
import { 
  GraphData, 
  GraphNode, 
  GraphEdge, 
  computeCooccurrence, 
  filterGraphData, 
  getGraphStats,
  CooccurrenceOptions 
} from '@/lib/graph/co-occurrence'
import { Character } from '@/lib/api/schemas'

interface CharacterNetworkGraphProps {
  characters: Character[]
  bookText: string
  className?: string
}

export function CharacterNetworkGraph({ 
  characters, 
  bookText, 
  className 
}: CharacterNetworkGraphProps) {
  const graphRef = useRef<any>()
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] })
  const [filteredData, setFilteredData] = useState<GraphData>({ nodes: [], edges: [] })
  
  // Graph options
  const [options, setOptions] = useState<CooccurrenceOptions>({
    windowSize: 3,
    minEdgeWeight: 2,
    minMentions: 2
  })

  // Display options
  const [showLabels, setShowLabels] = useState(true)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  // Compute graph data when characters or options change
  useEffect(() => {
    if (characters.length > 0 && bookText) {
      const newGraphData = computeCooccurrence(bookText, characters, options)
      setGraphData(newGraphData)
      setFilteredData(newGraphData)
    }
  }, [characters, bookText, options])

  // Apply filters when options change
  useEffect(() => {
    const filtered = filterGraphData(graphData, options)
    setFilteredData(filtered)
  }, [graphData, options.minEdgeWeight, options.minMentions])

  const stats = getGraphStats(filteredData)

  const handleZoomToFit = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400)
    }
  }

  const handleRecenter = () => {
    if (graphRef.current) {
      graphRef.current.centerAt(0, 0, 1000)
    }
  }

  const handleNodeClick = (node: any) => {
    setSelectedNode(node as GraphNode)
    if (graphRef.current) {
      // Center on clicked node
      graphRef.current.centerAt(node.x, node.y, 1000)
    }
  }

  const getNodeLabel = (node: any) => {
    if (!showLabels) return ''
    const graphNode = node as GraphNode
    return `${graphNode.name} (${graphNode.mentions})`
  }

  const getEdgeLabel = (edge: any) => {
    const graphEdge = edge as GraphEdge
    return `${graphEdge.weight} co-occurrences`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Character Network
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.totalNodes} characters, {stats.totalEdges} relationships
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRecenter}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomToFit}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controls Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
          {/* Window Size */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Window Size: {options.windowSize}
            </label>
            <Slider
              value={[options.windowSize]}
              onValueChange={([value]) => setOptions(prev => ({ ...prev, windowSize: value }))}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Sentences to analyze together
            </p>
          </div>

          {/* Min Edge Weight */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Min Edge Weight: {options.minEdgeWeight}
            </label>
            <Slider
              value={[options.minEdgeWeight]}
              onValueChange={([value]) => setOptions(prev => ({ ...prev, minEdgeWeight: value }))}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Min co-occurrences to show edge
            </p>
          </div>

          {/* Show Labels Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              {showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Show Labels
            </label>
            <Switch
              checked={showLabels}
              onCheckedChange={setShowLabels}
            />
            <p className="text-xs text-muted-foreground">
              Toggle character names
            </p>
          </div>
        </div>

        {/* Graph Visualization */}
        <div className="relative">
          <div className="w-full h-[500px] border rounded-lg overflow-hidden bg-background">
            {filteredData.nodes.length > 0 ? (
              <ForceGraph2D
                ref={graphRef}
                graphData={{
                  nodes: filteredData.nodes,
                  links: filteredData.edges
                }}
                width={undefined} // Auto-size to container
                height={500}
                backgroundColor="transparent"
                
                // Node configuration
                nodeId="id"
                nodeLabel={getNodeLabel}
                nodeColor={(node: any) => (node as GraphNode).color}
                nodeVal={(node: any) => (node as GraphNode).size}
                onNodeClick={handleNodeClick}
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                  const graphNode = node as GraphNode
                  const label = graphNode.name
                  const fontSize = 12 / globalScale
                  ctx.font = `${fontSize}px Inter, sans-serif`
                  
                  // Draw node circle
                  ctx.beginPath()
                  ctx.arc(node.x, node.y, graphNode.size / 2, 0, 2 * Math.PI)
                  ctx.fillStyle = graphNode.color
                  ctx.fill()
                  
                  // Draw border for selected node
                  if (selectedNode?.id === graphNode.id) {
                    ctx.strokeStyle = '#000'
                    ctx.lineWidth = 2 / globalScale
                    ctx.stroke()
                  }
                  
                  // Draw label if enabled and zoom level is sufficient
                  if (showLabels && globalScale > 0.8) {
                    const textWidth = ctx.measureText(label).width
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2)
                    
                    // Draw background
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
                    ctx.fillRect(
                      node.x - bckgDimensions[0] / 2, 
                      node.y + graphNode.size / 2 + 2, 
                      bckgDimensions[0], 
                      bckgDimensions[1]
                    )
                    
                    // Draw text
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillStyle = '#000'
                    ctx.fillText(
                      label, 
                      node.x, 
                      node.y + graphNode.size / 2 + 2 + bckgDimensions[1] / 2
                    )
                  }
                }}
                
                // Link configuration
                linkSource="source"
                linkTarget="target"
                linkWidth={(link: any) => Math.sqrt((link as GraphEdge).weight)}
                linkColor={() => '#8b5cf6'}

                linkLabel={getEdgeLabel}
                
                // Physics
                warmupTicks={100}
                cooldownTicks={0}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center space-y-2">
                  <Network className="h-12 w-12 mx-auto" />
                  <p>No character relationships found</p>
                  <p className="text-xs">Try adjusting the filters above</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className="absolute top-4 left-4 bg-background/90 p-3 rounded-lg border shadow-sm">
            <h4 className="font-medium text-sm mb-2">Legend</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Major (80+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Important (60+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Secondary (40+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Minor (20+)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Node Info */}
        {selectedNode && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h4 className="font-medium mb-2">{selectedNode.name}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Mentions:</span>
                <p className="font-medium">{selectedNode.mentions}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Importance:</span>
                <p className="font-medium">{selectedNode.importance}/100</p>
              </div>
              <div>
                <span className="text-muted-foreground">Connections:</span>
                <p className="font-medium">
                  {filteredData.edges.filter(edge => 
                    edge.source === selectedNode.id || edge.target === selectedNode.id
                  ).length}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Aliases:</span>
                <p className="font-medium">
                  {selectedNode.aliases.length > 0 ? selectedNode.aliases.join(', ') : 'None'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Graph Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold text-primary">{stats.totalNodes}</p>
            <p className="text-xs text-muted-foreground">Characters</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold text-primary">{stats.totalEdges}</p>
            <p className="text-xs text-muted-foreground">Relationships</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold text-primary">{stats.totalCooccurrences}</p>
            <p className="text-xs text-muted-foreground">Co-occurrences</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold text-primary">{stats.avgConnections}</p>
            <p className="text-xs text-muted-foreground">Avg Connections</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
