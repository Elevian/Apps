export interface NetworkMetrics {
  nodeId: string
  name: string
  
  // Degree metrics
  degree: number
  weightedDegree: number
  inDegree: number
  outDegree: number
  
  // Centrality metrics
  eigenvectorCentrality: number
  betweennessCentrality: number
  closenessCentrality: number
  
  // Clustering
  clusteringCoefficient: number
  
  // Additional metrics
  pageRank: number
  eccentricity: number
  
  // Derived metrics
  importance: number // Composite score
  influence: number  // Based on centrality measures
}

export interface NetworkStats {
  nodeCount: number
  edgeCount: number
  density: number
  averageDegree: number
  averageClustering: number
  diameter: number
  radius: number
  components: number
  modularity: number
}

export interface GraphData {
  nodes: Array<{ id: string; name: string; [key: string]: any }>
  edges: Array<{ source: string; target: string; weight: number; [key: string]: any }>
}

/**
 * Comprehensive network metrics calculator
 */
export class NetworkMetricsCalculator {
  
  /**
   * Calculate all network metrics for nodes
   */
  calculateMetrics(graph: GraphData): {
    nodeMetrics: NetworkMetrics[]
    networkStats: NetworkStats
  } {
    const adjacencyMatrix = this.buildAdjacencyMatrix(graph)
    const nodeIndices = this.buildNodeIndices(graph)
    
    const nodeMetrics = graph.nodes.map(node => {
      const nodeIndex = nodeIndices.get(node.id)!
      
      return {
        nodeId: node.id,
        name: node.name,
        
        // Degree metrics
        degree: this.calculateDegree(nodeIndex, adjacencyMatrix),
        weightedDegree: this.calculateWeightedDegree(nodeIndex, adjacencyMatrix),
        inDegree: this.calculateInDegree(nodeIndex, adjacencyMatrix),
        outDegree: this.calculateOutDegree(nodeIndex, adjacencyMatrix),
        
        // Centrality metrics
        eigenvectorCentrality: 0, // Will be calculated below
        betweennessCentrality: 0, // Will be calculated below
        closenessCentrality: this.calculateClosenessCentrality(nodeIndex, adjacencyMatrix),
        
        // Clustering
        clusteringCoefficient: this.calculateClusteringCoefficient(nodeIndex, adjacencyMatrix),
        
        // Additional metrics
        pageRank: 0, // Will be calculated below
        eccentricity: this.calculateEccentricity(nodeIndex, adjacencyMatrix),
        
        // Will be calculated after other metrics
        importance: 0,
        influence: 0
      }
    })

    // Calculate metrics that require global computation
    const eigenvectorCentralities = this.calculateEigenvectorCentrality(adjacencyMatrix)
    const betweennessCentralities = this.calculateBetweennessCentrality(adjacencyMatrix)
    const pageRanks = this.calculatePageRank(adjacencyMatrix)

    // Update node metrics with global calculations
    nodeMetrics.forEach((metrics, index) => {
      metrics.eigenvectorCentrality = eigenvectorCentralities[index]
      metrics.betweennessCentrality = betweennessCentralities[index]
      metrics.pageRank = pageRanks[index]
      
      // Calculate composite scores
      metrics.importance = this.calculateImportance(metrics)
      metrics.influence = this.calculateInfluence(metrics)
    })

    // Calculate network-wide statistics
    const networkStats = this.calculateNetworkStats(graph, adjacencyMatrix, nodeMetrics)

    return { nodeMetrics, networkStats }
  }

  /**
   * Build adjacency matrix from graph
   */
  private buildAdjacencyMatrix(graph: GraphData): number[][] {
    const nodeCount = graph.nodes.length
    const matrix = Array(nodeCount).fill(null).map(() => Array(nodeCount).fill(0))
    const nodeIndices = this.buildNodeIndices(graph)

    graph.edges.forEach(edge => {
      const sourceIndex = nodeIndices.get(edge.source)
      const targetIndex = nodeIndices.get(edge.target)
      
      if (sourceIndex !== undefined && targetIndex !== undefined) {
        // Undirected graph - set both directions
        matrix[sourceIndex][targetIndex] = edge.weight
        matrix[targetIndex][sourceIndex] = edge.weight
      }
    })

    return matrix
  }

  /**
   * Build mapping from node ID to matrix index
   */
  private buildNodeIndices(graph: GraphData): Map<string, number> {
    const indices = new Map<string, number>()
    graph.nodes.forEach((node, index) => {
      indices.set(node.id, index)
    })
    return indices
  }

  /**
   * Calculate degree (number of connections)
   */
  private calculateDegree(nodeIndex: number, matrix: number[][]): number {
    return matrix[nodeIndex].filter(weight => weight > 0).length
  }

  /**
   * Calculate weighted degree (sum of edge weights)
   */
  private calculateWeightedDegree(nodeIndex: number, matrix: number[][]): number {
    return matrix[nodeIndex].reduce((sum, weight) => sum + weight, 0)
  }

  /**
   * Calculate in-degree (for directed graphs)
   */
  private calculateInDegree(nodeIndex: number, matrix: number[][]): number {
    let inDegree = 0
    for (let i = 0; i < matrix.length; i++) {
      if (matrix[i][nodeIndex] > 0) inDegree++
    }
    return inDegree
  }

  /**
   * Calculate out-degree (for directed graphs)
   */
  private calculateOutDegree(nodeIndex: number, matrix: number[][]): number {
    return this.calculateDegree(nodeIndex, matrix)
  }

  /**
   * Calculate eigenvector centrality using power iteration
   */
  private calculateEigenvectorCentrality(matrix: number[][]): number[] {
    const n = matrix.length
    if (n === 0) return []

    let vector = Array(n).fill(1 / Math.sqrt(n))
    const maxIterations = 100
    const tolerance = 1e-6

    for (let iter = 0; iter < maxIterations; iter++) {
      const newVector = Array(n).fill(0)
      
      // Matrix multiplication: newVector = matrix * vector
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          newVector[i] += matrix[i][j] * vector[j]
        }
      }

      // Normalize
      const norm = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0))
      if (norm === 0) break

      for (let i = 0; i < n; i++) {
        newVector[i] /= norm
      }

      // Check convergence
      const diff = vector.reduce((sum, val, i) => sum + Math.abs(val - newVector[i]), 0)
      vector = newVector
      
      if (diff < tolerance) break
    }

    return vector
  }

  /**
   * Calculate betweenness centrality (approximate for performance)
   */
  private calculateBetweennessCentrality(matrix: number[][]): number[] {
    const n = matrix.length
    const centrality = Array(n).fill(0)
    
    // Use sampling for large graphs to maintain performance
    const sampleSize = Math.min(n, 50)
    const sampleIndices = this.sampleIndices(n, sampleSize)

    sampleIndices.forEach(source => {
      // Single-source shortest paths using Dijkstra
      const { distances, paths } = this.dijkstra(matrix, source)
      
      sampleIndices.forEach(target => {
        if (source === target) return
        
        const pathList = this.reconstructPaths(paths, source, target)
        pathList.forEach(path => {
          // Add to betweenness for intermediate nodes
          for (let i = 1; i < path.length - 1; i++) {
            centrality[path[i]] += 1 / pathList.length
          }
        })
      })
    })

    // Normalize by number of pairs and scale by sampling ratio
    const scaleFactor = (n * (n - 1)) / (sampleSize * (sampleSize - 1))
    return centrality.map(c => (c * scaleFactor) / ((n - 1) * (n - 2)))
  }

  /**
   * Calculate closeness centrality
   */
  private calculateClosenessCentrality(nodeIndex: number, matrix: number[][]): number {
    const { distances } = this.dijkstra(matrix, nodeIndex)
    const validDistances = distances.filter(d => d < Infinity && d > 0)
    
    if (validDistances.length === 0) return 0
    
    const totalDistance = validDistances.reduce((sum, d) => sum + d, 0)
    return validDistances.length / totalDistance
  }

  /**
   * Calculate clustering coefficient
   */
  private calculateClusteringCoefficient(nodeIndex: number, matrix: number[][]): number {
    const neighbors: number[] = []
    
    // Find all neighbors
    for (let i = 0; i < matrix.length; i++) {
      if (i !== nodeIndex && matrix[nodeIndex][i] > 0) {
        neighbors.push(i)
      }
    }

    if (neighbors.length < 2) return 0

    // Count edges between neighbors
    let edgeCount = 0
    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        if (matrix[neighbors[i]][neighbors[j]] > 0) {
          edgeCount++
        }
      }
    }

    const possibleEdges = (neighbors.length * (neighbors.length - 1)) / 2
    return edgeCount / possibleEdges
  }

  /**
   * Calculate PageRank
   */
  private calculatePageRank(matrix: number[][], dampingFactor = 0.85): number[] {
    const n = matrix.length
    if (n === 0) return []

    let pageRank = Array(n).fill(1 / n)
    const maxIterations = 100
    const tolerance = 1e-6

    // Normalize matrix (row-stochastic)
    const normalizedMatrix = matrix.map(row => {
      const sum = row.reduce((s, val) => s + val, 0)
      return sum > 0 ? row.map(val => val / sum) : row
    })

    for (let iter = 0; iter < maxIterations; iter++) {
      const newPageRank = Array(n).fill((1 - dampingFactor) / n)
      
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          newPageRank[i] += dampingFactor * normalizedMatrix[j][i] * pageRank[j]
        }
      }

      // Check convergence
      const diff = pageRank.reduce((sum, val, i) => sum + Math.abs(val - newPageRank[i]), 0)
      pageRank = newPageRank
      
      if (diff < tolerance) break
    }

    return pageRank
  }

  /**
   * Calculate eccentricity (maximum distance to any other node)
   */
  private calculateEccentricity(nodeIndex: number, matrix: number[][]): number {
    const { distances } = this.dijkstra(matrix, nodeIndex)
    const validDistances = distances.filter(d => d < Infinity)
    return validDistances.length > 0 ? Math.max(...validDistances) : Infinity
  }

  /**
   * Dijkstra's shortest path algorithm
   */
  private dijkstra(matrix: number[][], source: number): {
    distances: number[]
    paths: number[][]
  } {
    const n = matrix.length
    const distances = Array(n).fill(Infinity)
    const previous = Array(n).fill(-1)
    const visited = Array(n).fill(false)
    
    distances[source] = 0
    
    for (let i = 0; i < n; i++) {
      // Find minimum distance unvisited node
      let minDistance = Infinity
      let minIndex = -1
      
      for (let j = 0; j < n; j++) {
        if (!visited[j] && distances[j] < minDistance) {
          minDistance = distances[j]
          minIndex = j
        }
      }
      
      if (minIndex === -1) break
      visited[minIndex] = true
      
      // Update distances to neighbors
      for (let j = 0; j < n; j++) {
        if (!visited[j] && matrix[minIndex][j] > 0) {
          const newDistance = distances[minIndex] + (1 / matrix[minIndex][j]) // Use weight as inverse distance
          if (newDistance < distances[j]) {
            distances[j] = newDistance
            previous[j] = minIndex
          }
        }
      }
    }
    
    // Build paths array
    const paths = Array(n).fill(null).map(() => [] as number[])
    for (let i = 0; i < n; i++) {
      if (distances[i] < Infinity) {
        const path: number[] = []
        let current = i
        while (current !== -1) {
          path.unshift(current)
          current = previous[current]
        }
        paths[i] = path
      }
    }
    
    return { distances, paths }
  }

  /**
   * Reconstruct all shortest paths between two nodes
   */
  private reconstructPaths(paths: number[][], source: number, target: number): number[][] {
    // Simplified - return single shortest path
    return paths[target].length > 0 ? [paths[target]] : []
  }

  /**
   * Sample random indices for approximate algorithms
   */
  private sampleIndices(n: number, sampleSize: number): number[] {
    if (sampleSize >= n) return Array.from({ length: n }, (_, i) => i)
    
    const indices: number[] = []
    const used = new Set<number>()
    
    while (indices.length < sampleSize) {
      const index = Math.floor(Math.random() * n)
      if (!used.has(index)) {
        indices.push(index)
        used.add(index)
      }
    }
    
    return indices
  }

  /**
   * Calculate composite importance score
   */
  private calculateImportance(metrics: NetworkMetrics): number {
    return (
      metrics.weightedDegree * 0.3 +
      metrics.eigenvectorCentrality * 0.25 +
      metrics.betweennessCentrality * 0.25 +
      metrics.pageRank * 0.2
    )
  }

  /**
   * Calculate influence score
   */
  private calculateInfluence(metrics: NetworkMetrics): number {
    return (
      metrics.betweennessCentrality * 0.4 +
      metrics.eigenvectorCentrality * 0.3 +
      metrics.closenessCentrality * 0.3
    )
  }

  /**
   * Calculate network-wide statistics
   */
  private calculateNetworkStats(
    graph: GraphData, 
    matrix: number[][], 
    nodeMetrics: NetworkMetrics[]
  ): NetworkStats {
    const nodeCount = graph.nodes.length
    const edgeCount = graph.edges.length
    const maxPossibleEdges = (nodeCount * (nodeCount - 1)) / 2
    
    return {
      nodeCount,
      edgeCount,
      density: maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0,
      averageDegree: nodeMetrics.reduce((sum, m) => sum + m.degree, 0) / nodeCount,
      averageClustering: nodeMetrics.reduce((sum, m) => sum + m.clusteringCoefficient, 0) / nodeCount,
      diameter: Math.max(...nodeMetrics.map(m => m.eccentricity).filter(e => e < Infinity)),
      radius: Math.min(...nodeMetrics.map(m => m.eccentricity).filter(e => e < Infinity)),
      components: this.countConnectedComponents(matrix),
      modularity: this.calculateModularity(graph, matrix)
    }
  }

  /**
   * Count connected components
   */
  private countConnectedComponents(matrix: number[][]): number {
    const n = matrix.length
    const visited = Array(n).fill(false)
    let components = 0

    const dfs = (node: number) => {
      visited[node] = true
      for (let i = 0; i < n; i++) {
        if (!visited[i] && matrix[node][i] > 0) {
          dfs(i)
        }
      }
    }

    for (let i = 0; i < n; i++) {
      if (!visited[i]) {
        dfs(i)
        components++
      }
    }

    return components
  }

  /**
   * Calculate modularity (simplified)
   */
  private calculateModularity(graph: GraphData, matrix: number[][]): number {
    // Simplified modularity calculation
    // In practice, you'd use community detection algorithms like Louvain
    const totalEdges = graph.edges.reduce((sum, edge) => sum + edge.weight, 0)
    if (totalEdges === 0) return 0

    let modularity = 0
    const n = matrix.length

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const actualWeight = matrix[i][j]
        const ki = matrix[i].reduce((sum, w) => sum + w, 0)
        const kj = matrix[j].reduce((sum, w) => sum + w, 0)
        const expectedWeight = (ki * kj) / (2 * totalEdges)
        
        // Assume same community for simplicity (delta = 1)
        modularity += (actualWeight - expectedWeight) / (2 * totalEdges)
      }
    }

    return modularity
  }

  /**
   * Export metrics to CSV format
   */
  static exportToCSV(nodeMetrics: NetworkMetrics[], networkStats: NetworkStats): string {
    const headers = [
      'Node ID',
      'Name',
      'Degree',
      'Weighted Degree',
      'Eigenvector Centrality',
      'Betweenness Centrality',
      'Closeness Centrality',
      'Clustering Coefficient',
      'PageRank',
      'Importance',
      'Influence'
    ]

    const rows = nodeMetrics.map(metrics => [
      metrics.nodeId,
      metrics.name,
      metrics.degree.toFixed(0),
      metrics.weightedDegree.toFixed(2),
      metrics.eigenvectorCentrality.toFixed(4),
      metrics.betweennessCentrality.toFixed(4),
      metrics.closenessCentrality.toFixed(4),
      metrics.clusteringCoefficient.toFixed(4),
      metrics.pageRank.toFixed(4),
      metrics.importance.toFixed(4),
      metrics.influence.toFixed(4)
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      '# Network Statistics',
      `Node Count,${networkStats.nodeCount}`,
      `Edge Count,${networkStats.edgeCount}`,
      `Density,${networkStats.density.toFixed(4)}`,
      `Average Degree,${networkStats.averageDegree.toFixed(2)}`,
      `Average Clustering,${networkStats.averageClustering.toFixed(4)}`,
      `Diameter,${networkStats.diameter}`,
      `Components,${networkStats.components}`,
      `Modularity,${networkStats.modularity.toFixed(4)}`
    ].join('\n')

    return csvContent
  }
}
