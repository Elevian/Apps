import React from 'react'
import { motion } from 'framer-motion'
import { useAnalysisResults } from '@/contexts/analysis-context'
import { BookComparison } from '@/components/ui/book-comparison'
import { NameDisambiguation } from '@/components/ui/name-disambiguation'
import { ReadingGuide } from '@/components/ui/reading-guide'
import { ExportSharePanel } from '@/components/ui/export-share-panel'
import { PrivacySettingsPanel } from '@/components/ui/privacy-settings-panel'

export function DiscoverySection() {
  const { 
    hasResults,
    characters, 
    bookTitle,
    bookAuthor,
    bookText,
    characterResults
  } = useAnalysisResults()

  // Create current book data for comparison
  const currentBook = hasResults ? {
    bookId: '1', // This would be the actual book ID
    title: bookTitle || 'Unknown Book',
    author: bookAuthor || 'Unknown Author',
    characters: characters,
    graphData: { nodes: [], edges: [] }, // Placeholder - would be generated from characters
    networkMetrics: [], // Placeholder - would be calculated from graph data
    networkStats: {
      nodeCount: 0,
      edgeCount: 0,
      density: 0,
      averageDegree: 0,
      averageClustering: 0,
      diameter: 0,
      radius: 0,
      components: 1,
      modularity: 0
    },
    quotes: [], // Placeholder - would be extracted from text
    totalWords: characterResults?.text_length || 0,
    processingTime: characterResults?.processing_time_ms || 0
  } : undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      <div>
        <h2 id="discovery-heading" className="text-3xl font-bold text-center mb-2">
          Discovery & Analysis Tools
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          Advanced features for deeper literary analysis and comparison
        </p>
      </div>

      {/* Book Comparison */}
      <BookComparison 
        currentBook={currentBook}
        onComparisonComplete={(comparison) => {
          console.log('Comparison completed:', comparison)
          // Here you could update state to show comparison results
        }}
      />

      {/* Name Disambiguation */}
      <NameDisambiguation 
        characters={characters}
        onMergeAccepted={(suggestion) => {
          console.log('Merge accepted:', suggestion)
          // Here you would trigger a live graph update with merged character data
        }}
        onMergeRejected={(suggestion) => {
          console.log('Merge rejected:', suggestion)
        }}
        onBulkApply={(suggestions) => {
          console.log('Bulk apply:', suggestions)
          // Here you would apply all merges and update the graph
        }}
      />

      {/* Reading Guide */}
      <ReadingGuide 
        bookTitle={bookTitle}
        bookAuthor={bookAuthor}
        bookText={bookText}
        chapterTopics={[]} // Placeholder - would be extracted from text
        totalChapters={0} // Placeholder - would be calculated from text
        onSummaryGenerated={(summaries) => {
          console.log('Summaries generated:', summaries)
          // Here you could save summaries to state or local storage
        }}
      />

      {/* Export & Share Panel */}
      <ExportSharePanel 
        onExportComplete={(type) => {
          console.log(`${type} export completed`)
        }}
        onShareComplete={(url) => {
          console.log('Share URL generated:', url)
        }}
      />

      {/* Privacy & Security Settings */}
      <PrivacySettingsPanel 
        onSettingsChange={(settings) => {
          console.log('Privacy settings updated:', settings)
        }}
      />
    </motion.div>
  )
}
