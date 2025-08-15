import { Character } from '@/lib/api/schemas'

export interface GraphNode {
  id: string
  name: string
  mentions: number
  importance: number
  aliases: string[]
  size: number
  color: string
}

export interface GraphEdge {
  source: string
  target: string
  weight: number
  cooccurrences: number
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface CooccurrenceOptions {
  windowSize: number // Number of sentences to consider for co-occurrence
  minEdgeWeight: number // Minimum co-occurrence count to include edge
  minMentions: number // Minimum mentions to include character
}

/**
 * Compute character co-occurrence over sliding sentence windows
 */
export function computeCooccurrence(
  text: string,
  characters: Character[],
  options: CooccurrenceOptions = {
    windowSize: 3,
    minEdgeWeight: 2,
    minMentions: 2
  }
): GraphData {
  // Filter characters by minimum mentions
  const filteredCharacters = characters.filter(char => char.mentions >= options.minMentions)
  
  if (filteredCharacters.length === 0) {
    return { nodes: [], edges: [] }
  }

  // Split text into sentences
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10) // Filter out very short sentences

  // Create character name lookup with aliases
  const characterLookup = new Map<string, Character>()
  filteredCharacters.forEach(char => {
    // Add main name
    characterLookup.set(char.name.toLowerCase(), char)
    // Add aliases
    char.aliases?.forEach(alias => {
      characterLookup.set(alias.toLowerCase(), char)
    })
  })

  // Count co-occurrences in sliding windows
  const cooccurrenceMatrix = new Map<string, Map<string, number>>()
  
  // Initialize matrix
  filteredCharacters.forEach(char1 => {
    cooccurrenceMatrix.set(char1.name, new Map())
    filteredCharacters.forEach(char2 => {
      if (char1.name !== char2.name) {
        cooccurrenceMatrix.get(char1.name)!.set(char2.name, 0)
      }
    })
  })

  // Sliding window analysis
  for (let i = 0; i <= sentences.length - options.windowSize; i++) {
    const window = sentences.slice(i, i + options.windowSize).join(' ').toLowerCase()
    
    // Find all characters mentioned in this window
    const charactersInWindow: Character[] = []
    for (const [name, character] of characterLookup) {
      if (window.includes(name)) {
        // Avoid adding the same character multiple times (for aliases)
        if (!charactersInWindow.find(c => c.name === character.name)) {
          charactersInWindow.push(character)
        }
      }
    }

    // Count co-occurrences between all pairs in this window
    for (let j = 0; j < charactersInWindow.length; j++) {
      for (let k = j + 1; k < charactersInWindow.length; k++) {
        const char1 = charactersInWindow[j]
        const char2 = charactersInWindow[k]
        
        // Increment both directions
        const current1to2 = cooccurrenceMatrix.get(char1.name)!.get(char2.name) || 0
        const current2to1 = cooccurrenceMatrix.get(char2.name)!.get(char1.name) || 0
        
        cooccurrenceMatrix.get(char1.name)!.set(char2.name, current1to2 + 1)
        cooccurrenceMatrix.get(char2.name)!.set(char1.name, current2to1 + 1)
      }
    }
  }

  // Convert to graph data structure
  const nodes: GraphNode[] = filteredCharacters.map(char => ({
    id: char.name,
    name: char.name,
    mentions: char.mentions,
    importance: char.importance,
    aliases: char.aliases || [],
    size: Math.max(8, Math.min(30, Math.sqrt(char.mentions) * 3)), // Scale node size
    color: getCharacterColor(char.importance)
  }))

  const edges: GraphEdge[] = []
  const addedEdges = new Set<string>()

  cooccurrenceMatrix.forEach((targetMap, sourceName) => {
    targetMap.forEach((weight, targetName) => {
      if (weight >= options.minEdgeWeight) {
        // Create a consistent edge key to avoid duplicates
        const edgeKey = [sourceName, targetName].sort().join('-')
        
        if (!addedEdges.has(edgeKey)) {
          edges.push({
            source: sourceName,
            target: targetName,
            weight,
            cooccurrences: weight
          })
          addedEdges.add(edgeKey)
        }
      }
    })
  })

  return { nodes, edges }
}

/**
 * Get character color based on importance
 */
function getCharacterColor(importance: number): string {
  if (importance >= 80) return '#ef4444' // red-500 - major characters
  if (importance >= 60) return '#f97316' // orange-500 - important characters
  if (importance >= 40) return '#eab308' // yellow-500 - secondary characters
  if (importance >= 20) return '#22c55e' // green-500 - minor characters
  return '#6b7280' // gray-500 - background characters
}

/**
 * Filter graph data based on options
 */
export function filterGraphData(
  graphData: GraphData,
  options: Partial<CooccurrenceOptions>
): GraphData {
  const { minEdgeWeight = 2, minMentions = 2 } = options

  // Filter nodes by mentions
  const filteredNodes = graphData.nodes.filter(node => node.mentions >= minMentions)
  const nodeIds = new Set(filteredNodes.map(node => node.id))

  // Filter edges by weight and ensure both nodes exist
  const filteredEdges = graphData.edges.filter(edge => 
    edge.weight >= minEdgeWeight &&
    nodeIds.has(edge.source) &&
    nodeIds.has(edge.target)
  )

  return {
    nodes: filteredNodes,
    edges: filteredEdges
  }
}

/**
 * Generate graph statistics
 */
export function getGraphStats(graphData: GraphData) {
  const totalNodes = graphData.nodes.length
  const totalEdges = graphData.edges.length
  const totalCooccurrences = graphData.edges.reduce((sum, edge) => sum + edge.weight, 0)
  
  const avgConnections = totalNodes > 0 ? (totalEdges * 2) / totalNodes : 0
  
  const topConnected = graphData.nodes
    .map(node => ({
      name: node.name,
      connections: graphData.edges.filter(edge => 
        edge.source === node.id || edge.target === node.id
      ).length
    }))
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 3)

  return {
    totalNodes,
    totalEdges,
    totalCooccurrences,
    avgConnections: Math.round(avgConnections * 10) / 10,
    topConnected
  }
}
