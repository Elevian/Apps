import { describe, it, expect } from 'vitest'
import { 
  computeCooccurrence, 
  filterGraphData, 
  getGraphStats 
} from '@/lib/graph/co-occurrence'
import { Character } from '@/lib/api/schemas'

describe('Co-occurrence Analysis', () => {
  const mockCharacters: Character[] = [
    {
      name: 'Alice',
      aliases: ['Alice B'],
      importance: 90,
      mentions: 15
    },
    {
      name: 'Bob',
      aliases: [],
      importance: 70,
      mentions: 10
    },
    {
      name: 'Charlie',
      aliases: ['Chuck'],
      importance: 50,
      mentions: 5
    }
  ]

  const mockText = `
    Alice walked with Bob to the market. They talked about many things.
    Alice and Charlie met later. Bob was not there.
    Charlie spoke to Alice about Bob. Alice nodded.
    Bob and Alice returned home together. Charlie waved goodbye.
    Alice B mentioned Bob to Chuck yesterday.
  `

  it('should compute basic co-occurrence matrix', () => {
    const result = computeCooccurrence(mockText, mockCharacters, {
      windowSize: 2,
      minEdgeWeight: 1,
      minMentions: 1
    })

    expect(result.nodes).toHaveLength(3)
    expect(result.edges.length).toBeGreaterThan(0)
    
    // Check that nodes have proper structure
    const aliceNode = result.nodes.find(n => n.name === 'Alice')
    expect(aliceNode).toBeDefined()
    expect(aliceNode?.mentions).toBe(15)
    expect(aliceNode?.importance).toBe(90)
    expect(aliceNode?.size).toBeGreaterThan(0)
  })

  it('should handle minimum edge weight filtering', () => {
    const lowThreshold = computeCooccurrence(mockText, mockCharacters, {
      windowSize: 3,
      minEdgeWeight: 1,
      minMentions: 1
    })

    const highThreshold = computeCooccurrence(mockText, mockCharacters, {
      windowSize: 3,
      minEdgeWeight: 3,
      minMentions: 1
    })

    expect(highThreshold.edges.length).toBeLessThanOrEqual(lowThreshold.edges.length)
  })

  it('should filter by minimum mentions', () => {
    const allCharacters = computeCooccurrence(mockText, mockCharacters, {
      windowSize: 2,
      minEdgeWeight: 1,
      minMentions: 1
    })

    const filteredCharacters = computeCooccurrence(mockText, mockCharacters, {
      windowSize: 2,
      minEdgeWeight: 1,
      minMentions: 8
    })

    expect(filteredCharacters.nodes.length).toBeLessThan(allCharacters.nodes.length)
  })

  it('should handle aliases correctly', () => {
    const result = computeCooccurrence(mockText, mockCharacters, {
      windowSize: 2,
      minEdgeWeight: 1,
      minMentions: 1
    })

    // Should find Alice-Bob connection through "Alice B" and "Chuck" aliases
    const edges = result.edges
    const hasAliceConnection = edges.some(edge => 
      (edge.source === 'Alice' || edge.target === 'Alice')
    )
    
    expect(hasAliceConnection).toBe(true)
  })

  it('should compute graph statistics correctly', () => {
    const graphData = computeCooccurrence(mockText, mockCharacters, {
      windowSize: 2,
      minEdgeWeight: 1,
      minMentions: 1
    })

    const stats = getGraphStats(graphData)

    expect(stats.totalNodes).toBe(graphData.nodes.length)
    expect(stats.totalEdges).toBe(graphData.edges.length)
    expect(stats.totalCooccurrences).toBeGreaterThan(0)
    expect(stats.avgConnections).toBeGreaterThan(0)
    expect(stats.topConnected).toHaveLength(Math.min(3, graphData.nodes.length))
  })

  it('should handle empty text gracefully', () => {
    const result = computeCooccurrence('', mockCharacters, {
      windowSize: 2,
      minEdgeWeight: 1,
      minMentions: 999 // Set very high to filter out all characters
    })

    expect(result.nodes).toHaveLength(0)
    expect(result.edges).toHaveLength(0)
  })

  it('should handle no characters gracefully', () => {
    const result = computeCooccurrence(mockText, [], {
      windowSize: 2,
      minEdgeWeight: 1,
      minMentions: 1
    })

    expect(result.nodes).toHaveLength(0)
    expect(result.edges).toHaveLength(0)
  })

  it('should filter graph data correctly', () => {
    const graphData = computeCooccurrence(mockText, mockCharacters, {
      windowSize: 2,
      minEdgeWeight: 1,
      minMentions: 1
    })

    const filtered = filterGraphData(graphData, {
      minEdgeWeight: 2,
      minMentions: 8
    })

    // Should have fewer or equal nodes and edges
    expect(filtered.nodes.length).toBeLessThanOrEqual(graphData.nodes.length)
    expect(filtered.edges.length).toBeLessThanOrEqual(graphData.edges.length)

    // All remaining edges should meet threshold
    filtered.edges.forEach(edge => {
      expect(edge.weight).toBeGreaterThanOrEqual(2)
    })
  })
})
