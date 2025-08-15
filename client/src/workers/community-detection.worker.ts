import { expose } from 'comlink'

export interface CommunityNode {
  id: string
  community: number
  modularity: number
}

export interface CommunityResult {
  nodes: CommunityNode[]
  communities: Community[]
  modularity: number
  iterations: number
  method: 'louvain' | 'label_propagation'
}

export interface Community {
  id: number
  nodes: string[]
  size: number
  internalEdges: number
  externalEdges: number
  density: number
}

export interface GraphEdge {
  source: string
  target: string
  weight: number
}

export interface GraphNode {
  id: string
  name: string
}

class CommunityDetectionWorker {
  
  /**
   * Louvain method for community detection
   */
  async louvainCommunityDetection(
    nodes: GraphNode[],
    edges: GraphEdge[],
    resolution = 1.0,
    onProgress?: (progress: number) => void
  ): Promise<CommunityResult> {
    const startTime = Date.now()
    
    // Build adjacency list
    const adjacency = this.buildAdjacencyList(nodes, edges)
    const nodeIds = nodes.map(n => n.id)
    
    // Initialize - each node in its own community
    let communities = new Map<string, number>()
    nodeIds.forEach((id, index) => communities.set(id, index))
    
    let totalWeight = edges.reduce((sum, edge) => sum + edge.weight, 0) * 2 // Undirected
    let currentModularity = this.calculateModularity(communities, adjacency, totalWeight)
    
    let improved = true
    let iteration = 0
    const maxIterations = 100
    
    onProgress?.(10)
    
    // Phase 1: Local optimization
    while (improved && iteration < maxIterations) {
      improved = false
      
      for (const nodeId of nodeIds) {
        const currentCommunity = communities.get(nodeId)!
        const neighborCommunities = this.getNeighborCommunities(nodeId, adjacency, communities)
        
        let bestCommunity = currentCommunity
        let bestGain = 0
        
        // Try moving to each neighbor community
        for (const [neighborCommunity, _] of neighborCommunities) {
          if (neighborCommunity === currentCommunity) continue
          
          const gain = this.calculateModularityGain(
            nodeId, 
            currentCommunity, 
            neighborCommunity, 
            adjacency, 
            communities, 
            totalWeight,
            resolution
          )
          
          if (gain > bestGain) {
            bestGain = gain
            bestCommunity = neighborCommunity
          }
        }
        
        // Move node if improvement found
        if (bestCommunity !== currentCommunity) {
          communities.set(nodeId, bestCommunity)
          improved = true
        }
      }
      
      const newModularity = this.calculateModularity(communities, adjacency, totalWeight)
      if (newModularity > currentModularity) {
        currentModularity = newModularity
      }
      
      iteration++
      onProgress?.(10 + (iteration / maxIterations) * 70)
    }
    
    onProgress?.(80)
    
    // Phase 2: Community aggregation (simplified)
    let finalCommunities = this.aggregateCommunities(communities)
    
    onProgress?.(90)
    
    // Build final result
    const communityStats = this.calculateCommunityStats(finalCommunities, adjacency, edges)
    const finalModularity = this.calculateModularity(finalCommunities, adjacency, totalWeight)
    
    onProgress?.(100)
    
    return {
      nodes: nodeIds.map(id => ({
        id,
        community: finalCommunities.get(id)!,
        modularity: finalModularity
      })),
      communities: communityStats,
      modularity: finalModularity,
      iterations: iteration,
      method: 'louvain'
    }
  }
  
  /**
   * Label propagation algorithm for community detection
   */
  async labelPropagationCommunityDetection(
    nodes: GraphNode[],
    edges: GraphEdge[],
    maxIterations = 50,
    onProgress?: (progress: number) => void
  ): Promise<CommunityResult> {
    
    const adjacency = this.buildAdjacencyList(nodes, edges)
    const nodeIds = nodes.map(n => n.id)
    
    // Initialize each node with its own label
    let labels = new Map<string, number>()
    nodeIds.forEach((id, index) => labels.set(id, index))
    
    onProgress?.(10)
    
    for (let iter = 0; iter < maxIterations; iter++) {
      let changed = false
      
      // Shuffle nodes for randomness
      const shuffledNodes = [...nodeIds].sort(() => Math.random() - 0.5)
      
      for (const nodeId of shuffledNodes) {
        // Count neighbor labels weighted by edge weight
        const neighborLabels = new Map<number, number>()
        
        if (adjacency.has(nodeId)) {
          for (const [neighborId, weight] of adjacency.get(nodeId)!) {
            const label = labels.get(neighborId)!
            neighborLabels.set(label, (neighborLabels.get(label) || 0) + weight)
          }
        }
        
        // Choose most frequent neighbor label
        if (neighborLabels.size > 0) {
          const bestLabel = Array.from(neighborLabels.entries())
            .sort((a, b) => b[1] - a[1])[0][0]
          
          if (labels.get(nodeId) !== bestLabel) {
            labels.set(nodeId, bestLabel)
            changed = true
          }
        }
      }
      
      if (!changed) break
      onProgress?.(10 + (iter / maxIterations) * 80)
    }
    
    onProgress?.(90)
    
    // Renumber communities to be contiguous
    const uniqueLabels = Array.from(new Set(labels.values())).sort()
    const labelMapping = new Map<number, number>()
    uniqueLabels.forEach((label, index) => labelMapping.set(label, index))
    
    const finalCommunities = new Map<string, number>()
    labels.forEach((label, nodeId) => {
      finalCommunities.set(nodeId, labelMapping.get(label)!)
    })
    
    // Calculate statistics
    const totalWeight = edges.reduce((sum, edge) => sum + edge.weight, 0) * 2
    const communityStats = this.calculateCommunityStats(finalCommunities, adjacency, edges)
    const modularity = this.calculateModularity(finalCommunities, adjacency, totalWeight)
    
    onProgress?.(100)
    
    return {
      nodes: nodeIds.map(id => ({
        id,
        community: finalCommunities.get(id)!,
        modularity: modularity
      })),
      communities: communityStats,
      modularity: modularity,
      iterations: maxIterations,
      method: 'label_propagation'
    }
  }
  
  /**
   * Build adjacency list representation
   */
  private buildAdjacencyList(
    nodes: GraphNode[], 
    edges: GraphEdge[]
  ): Map<string, Map<string, number>> {
    const adjacency = new Map<string, Map<string, number>>()
    
    // Initialize all nodes
    nodes.forEach(node => {
      adjacency.set(node.id, new Map())
    })
    
    // Add edges (undirected)
    edges.forEach(edge => {
      const sourceAdj = adjacency.get(edge.source)!
      const targetAdj = adjacency.get(edge.target)!
      
      sourceAdj.set(edge.target, edge.weight)
      targetAdj.set(edge.source, edge.weight)
    })
    
    return adjacency
  }
  
  /**
   * Calculate modularity of current community assignment
   */
  private calculateModularity(
    communities: Map<string, number>,
    adjacency: Map<string, Map<string, number>>,
    totalWeight: number
  ): number {
    let modularity = 0
    
    const nodeDegrees = new Map<string, number>()
    adjacency.forEach((neighbors, nodeId) => {
      const degree = Array.from(neighbors.values()).reduce((sum, weight) => sum + weight, 0)
      nodeDegrees.set(nodeId, degree)
    })
    
    adjacency.forEach((neighbors, nodeId1) => {
      const community1 = communities.get(nodeId1)!
      const degree1 = nodeDegrees.get(nodeId1)!
      
      neighbors.forEach((weight, nodeId2) => {
        const community2 = communities.get(nodeId2)!
        
        if (community1 === community2) {
          const degree2 = nodeDegrees.get(nodeId2)!
          const expected = (degree1 * degree2) / totalWeight
          modularity += weight - expected
        }
      })
    })
    
    return modularity / totalWeight
  }
  
  /**
   * Calculate modularity gain from moving a node
   */
  private calculateModularityGain(
    nodeId: string,
    fromCommunity: number,
    toCommunity: number,
    adjacency: Map<string, Map<string, number>>,
    communities: Map<string, number>,
    totalWeight: number,
    resolution: number
  ): number {
    // Simplified modularity gain calculation
    const neighbors = adjacency.get(nodeId) || new Map()
    
    let edgesToFrom = 0
    let edgesToTo = 0
    
    neighbors.forEach((weight, neighborId) => {
      const neighborCommunity = communities.get(neighborId)!
      if (neighborCommunity === fromCommunity) {
        edgesToFrom += weight
      }
      if (neighborCommunity === toCommunity) {
        edgesToTo += weight
      }
    })
    
    const nodeDegree = Array.from(neighbors.values()).reduce((sum, weight) => sum + weight, 0)
    
    // Simplified gain calculation
    return resolution * (edgesToTo - edgesToFrom) / totalWeight
  }
  
  /**
   * Get neighboring communities of a node
   */
  private getNeighborCommunities(
    nodeId: string,
    adjacency: Map<string, Map<string, number>>,
    communities: Map<string, number>
  ): Map<number, number> {
    const neighborCommunities = new Map<number, number>()
    const neighbors = adjacency.get(nodeId) || new Map()
    
    neighbors.forEach((weight, neighborId) => {
      const community = communities.get(neighborId)!
      neighborCommunities.set(community, (neighborCommunities.get(community) || 0) + weight)
    })
    
    return neighborCommunities
  }
  
  /**
   * Aggregate small communities (simplified)
   */
  private aggregateCommunities(communities: Map<string, number>): Map<string, number> {
    // For now, just renumber to make contiguous
    const uniqueCommunities = Array.from(new Set(communities.values())).sort()
    const mapping = new Map<number, number>()
    uniqueCommunities.forEach((oldId, newId) => mapping.set(oldId, newId))
    
    const result = new Map<string, number>()
    communities.forEach((communityId, nodeId) => {
      result.set(nodeId, mapping.get(communityId)!)
    })
    
    return result
  }
  
  /**
   * Calculate community statistics
   */
  private calculateCommunityStats(
    communities: Map<string, number>,
    adjacency: Map<string, Map<string, number>>,
    edges: GraphEdge[]
  ): Community[] {
    const communityNodes = new Map<number, string[]>()
    const communityInternalEdges = new Map<number, number>()
    const communityExternalEdges = new Map<number, number>()
    
    // Group nodes by community
    communities.forEach((community, nodeId) => {
      if (!communityNodes.has(community)) {
        communityNodes.set(community, [])
        communityInternalEdges.set(community, 0)
        communityExternalEdges.set(community, 0)
      }
      communityNodes.get(community)!.push(nodeId)
    })
    
    // Count internal and external edges
    edges.forEach(edge => {
      const sourceCommunity = communities.get(edge.source)!
      const targetCommunity = communities.get(edge.target)!
      
      if (sourceCommunity === targetCommunity) {
        communityInternalEdges.set(sourceCommunity, 
          communityInternalEdges.get(sourceCommunity)! + edge.weight)
      } else {
        communityExternalEdges.set(sourceCommunity,
          communityExternalEdges.get(sourceCommunity)! + edge.weight)
        communityExternalEdges.set(targetCommunity,
          communityExternalEdges.get(targetCommunity)! + edge.weight)
      }
    })
    
    // Build community objects
    const result: Community[] = []
    communityNodes.forEach((nodes, communityId) => {
      const internalEdges = communityInternalEdges.get(communityId)!
      const externalEdges = communityExternalEdges.get(communityId)!
      const totalPossibleEdges = (nodes.length * (nodes.length - 1)) / 2
      
      result.push({
        id: communityId,
        nodes,
        size: nodes.length,
        internalEdges,
        externalEdges,
        density: totalPossibleEdges > 0 ? internalEdges / totalPossibleEdges : 0
      })
    })
    
    return result.sort((a, b) => b.size - a.size)
  }
}

// Expose worker API
const communityWorker = new CommunityDetectionWorker()
expose(communityWorker)
