import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { 
  FileText,
  Share2,
  Download,
  Copy,
  Link,
  Settings,
  Image,
  FileImage,
  FileJson,
  Database,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Zap
} from 'lucide-react'
import { generatePDFReport, type ReportOptions } from '@/lib/export/pdf-generator'
import { StateManager, type ShareableState, type ShareOptions } from '@/lib/sharing/state-manager'
import { useAnalysisResults } from '@/contexts/analysis-context'
import { toast } from 'sonner'

export interface ExportSharePanelProps {
  className?: string
  onExportComplete?: (type: string) => void
  onShareComplete?: (url: string) => void
}

export function ExportSharePanel({
  className = '',
  onExportComplete,
  onShareComplete
}: ExportSharePanelProps) {
  const { t } = useTranslation()
  const analysisData = useAnalysisResults()
  
  // Export state
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportType, setExportType] = useState<string | null>(null)
  
  // Share state
  const [isSharing, setIsSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string>('')
  const [compressionStats, setCompressionStats] = useState<any>(null)
  
  // Options
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    includeGraphImage: true,
    includeTimelines: true,
    includeQuotes: true,
    includeTopics: true,
    includeMetrics: true,
    maxQuotes: 10,
    format: 'a4',
    orientation: 'portrait',
    quality: 'high'
  })
  
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    includeQuotes: true,
    includeTopics: true,
    includeMetrics: true,
    maxQuotes: 20,
    compressionLevel: 'balanced'
  })

  /**
   * Generate PDF report
   */
  const handlePDFExport = useCallback(async () => {
    if (!analysisData.hasResults) {
      toast.error('No analysis data available for export')
      return
    }

    setIsExporting(true)
    setExportType('pdf')
    setExportProgress(0)

    try {
      await generatePDFReport(analysisData, reportOptions, (progress) => {
        setExportProgress(progress)
      })
      
      toast.success('PDF report generated successfully!')
      onExportComplete?.('pdf')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to generate PDF report')
    } finally {
      setIsExporting(false)
      setExportType(null)
      setExportProgress(0)
    }
  }, [analysisData, reportOptions, onExportComplete])

  /**
   * Export raw data as JSON
   */
  const handleJSONExport = useCallback(() => {
    if (!analysisData.hasResults) {
      toast.error('No analysis data available for export')
      return
    }

    const exportData = {
      book: {
        id: '1', // Placeholder - would be actual book ID
        title: analysisData.bookTitle,
        author: analysisData.bookAuthor
      },
      analysis: {
        characters: analysisData.characters,
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
        topics: [] // Placeholder - would be extracted from text
      },
      metadata: {
        exportDate: new Date().toISOString(),
        version: '2.0.0',
        stats: {
          processingTime: analysisData.characterResults?.processing_time_ms || 0,
          textLength: analysisData.characterResults?.text_length || 0,
          chaptersCount: 0, // Placeholder - would be calculated from text
          extractionMethod: analysisData.characterResults?.method || 'manual'
        }
      }
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${analysisData.bookTitle?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'analysis'}_data.json`
    link.click()
    URL.revokeObjectURL(url)

    toast.success('Analysis data exported as JSON!')
    onExportComplete?.('json')
  }, [analysisData, onExportComplete])

  /**
   * Export network data as CSV
   */
  const handleCSVExport = useCallback(() => {
    if (!analysisData.hasResults) {
      toast.error('No analysis data available for export')
      return
    }

    const graphData = { nodes: [], edges: [] } // Placeholder - would be generated from characters
    if (!graphData) {
      toast.error('No graph data available')
      return
    }

    // Nodes CSV
    const nodesCsv = [
      'Id,Label,Mentions,Importance,Degree,Betweenness,PageRank',
      ...graphData.nodes.map(node => {
        const metrics = null // Placeholder - would be calculated from graph data
        const character = analysisData.characters?.find(c => c.name === node.name)
        return `${node.id},"${node.name}",${character?.mentions || 0},${character?.importance || 0},${metrics?.degree || 0},${metrics?.betweennessCentrality?.toFixed(4) || 0},${metrics?.pageRank?.toFixed(4) || 0}`
      })
    ].join('\n')

    // Edges CSV
    const edgesCsv = [
      'Source,Target,Weight,Type',
      ...graphData.edges.map(edge => `${edge.source},${edge.target},${edge.weight},undirected`)
    ].join('\n')

    const fullCsv = 'NODES\n' + nodesCsv + '\n\nEDGES\n' + edgesCsv

    const blob = new Blob([fullCsv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${analysisData.bookTitle?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'analysis'}_network.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast.success('Network data exported as CSV!')
    onExportComplete?.('csv')
  }, [analysisData, onExportComplete])

  /**
   * Generate shareable URL
   */
  const handleGenerateShareURL = useCallback(async () => {
    if (!analysisData.hasResults) {
      toast.error('No analysis data available for sharing')
      return
    }

    setIsSharing(true)

    try {
      // Create shareable state
      const state = StateManager.createShareableState(
        analysisData.characterResults,
        {
          selectedCharacter: null, // Could get from UI state
          graphMode: 'default',
          graphSettings: {
            sentenceWindow: 3,
            minEdgeWeight: 2,
            showLabels: true,
            nodeSize: 1,
            linkWidth: 1
          }
        },
        shareOptions
      )

      // Generate URL
      const url = StateManager.generateShareURL(state, shareOptions)
      setShareUrl(url)

      // Get compression stats
      const stats = StateManager.getCompressionStats(state)
      setCompressionStats(stats)

      toast.success('Share URL generated!')
    } catch (error) {
      console.error('Failed to generate share URL:', error)
      toast.error('Failed to generate share URL')
    } finally {
      setIsSharing(false)
    }
  }, [analysisData, shareOptions])

  /**
   * Copy share URL to clipboard
   */
  const handleCopyShareURL = useCallback(async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Share URL copied to clipboard!')
      onShareComplete?.(shareUrl)
    } catch (error) {
      toast.error('Failed to copy URL to clipboard')
    }
  }, [shareUrl, onShareComplete])

  /**
   * Update URL with current state
   */
  const handleUpdateURL = useCallback(() => {
    if (!analysisData.hasResults) return

    try {
      const state = StateManager.createShareableState(analysisData.characterResults, {}, shareOptions)
      StateManager.updateURL(state, shareOptions)
      toast.success('URL updated with current analysis!')
    } catch (error) {
      console.error('Failed to update URL:', error)
      toast.error('Failed to update URL')
    }
  }, [analysisData, shareOptions])

  const hasData = analysisData.hasResults

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('common.export')} & Share
            {hasData && (
              <Badge variant="secondary">
                {analysisData.characters?.length || 0} characters
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          
          {/* Export Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t('common.export')} Options</h3>
            
            {/* Export Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                onClick={handlePDFExport}
                disabled={!hasData || isExporting}
                className="flex items-center gap-2"
              >
                {isExporting && exportType === 'pdf' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                PDF Report
              </Button>

              <Button
                variant="outline"
                onClick={handleJSONExport}
                disabled={!hasData}
                className="flex items-center gap-2"
              >
                <FileJson className="h-4 w-4" />
                JSON Data
              </Button>

              <Button
                variant="outline"
                onClick={handleCSVExport}
                disabled={!hasData}
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                CSV Network
              </Button>
            </div>

            {/* Export Progress */}
            <AnimatePresence>
              {isExporting && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span>Generating {exportType?.toUpperCase()} report...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="w-full" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* PDF Export Options */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground">PDF Report Options</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={reportOptions.includeGraphImage}
                    onCheckedChange={(checked) => 
                      setReportOptions(prev => ({ ...prev, includeGraphImage: checked }))
                    }
                  />
                  <label>Include Graph Image</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={reportOptions.includeQuotes}
                    onCheckedChange={(checked) => 
                      setReportOptions(prev => ({ ...prev, includeQuotes: checked }))
                    }
                  />
                  <label>Include Quotes</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={reportOptions.includeTopics}
                    onCheckedChange={(checked) => 
                      setReportOptions(prev => ({ ...prev, includeTopics: checked }))
                    }
                  />
                  <label>Include Topics</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={reportOptions.includeMetrics}
                    onCheckedChange={(checked) => 
                      setReportOptions(prev => ({ ...prev, includeMetrics: checked }))
                    }
                  />
                  <label>Include Metrics</label>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sharing Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Share Analysis</h3>
            
            {/* Share Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                onClick={handleGenerateShareURL}
                disabled={!hasData || isSharing}
                className="flex items-center gap-2"
              >
                {isSharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link className="h-4 w-4" />
                )}
                Generate Link
              </Button>

              <Button
                variant="outline"
                onClick={handleCopyShareURL}
                disabled={!shareUrl}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>

              <Button
                variant="outline"
                onClick={handleUpdateURL}
                disabled={!hasData}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Update URL
              </Button>
            </div>

            {/* Share URL Display */}
            <AnimatePresence>
              {shareUrl && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Share URL</label>
                    <div className="flex gap-2">
                      <Input
                        value={shareUrl}
                        readOnly
                        className="text-xs font-mono"
                      />
                      <Button
                        size="sm"
                        onClick={handleCopyShareURL}
                        className="flex-shrink-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Compression Stats */}
                  {compressionStats && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h5 className="text-xs font-medium mb-2">Compression Statistics</h5>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">Original Size:</span>
                          <span className="ml-1 font-mono">{(compressionStats.originalSize / 1024).toFixed(1)} KB</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Compressed:</span>
                          <span className="ml-1 font-mono">{(compressionStats.compressedSize / 1024).toFixed(1)} KB</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Compression:</span>
                          <span className="ml-1 font-mono">{compressionStats.compressionRatio}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">URL Length:</span>
                          <span className="ml-1 font-mono">{compressionStats.urlLength} chars</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Share Options */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground">Share Options</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={shareOptions.includeQuotes}
                    onCheckedChange={(checked) => 
                      setShareOptions(prev => ({ ...prev, includeQuotes: checked }))
                    }
                  />
                  <label>Include Quotes</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={shareOptions.includeTopics}
                    onCheckedChange={(checked) => 
                      setShareOptions(prev => ({ ...prev, includeTopics: checked }))
                    }
                  />
                  <label>Include Topics</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={shareOptions.includeMetrics}
                    onCheckedChange={(checked) => 
                      setShareOptions(prev => ({ ...prev, includeMetrics: checked }))
                    }
                  />
                  <label>Include Metrics</label>
                </div>
              </div>
            </div>
          </div>

          {/* Status Info */}
          {!hasData && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Complete an analysis to enable export and sharing features
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
