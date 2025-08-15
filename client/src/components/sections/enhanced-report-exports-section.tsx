import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Download, 
  Share2, 
  Database, 
  Image, 
  FileJson,
  FileSpreadsheet,
  Link,
  Copy,
  BarChart3,
  Network,
  Quote,
  Calendar,
  Settings,
  Zap
} from 'lucide-react'
import { useAnalysisResults } from '@/contexts/analysis-context'
import { ExportSharePanel } from '@/components/ui/export-share-panel'
import { SecurityDashboard } from '@/components/ui/security-dashboard'

export function EnhancedReportExportsSection() {
  const { t } = useTranslation()
  const { hasResults, characters, bookTitle, bookAuthor } = useAnalysisResults()
  const [activeTab, setActiveTab] = useState('exports')

  return (
    <section id="report-exports" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 id="report-exports-heading" className="text-3xl font-bold text-foreground mb-4">
              Reports & Data Export
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Generate professional reports, export your data, and share your analysis with others
            </p>
            {hasResults && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Badge variant="secondary">
                  {characters?.length || 0} characters analyzed
                </Badge>
                {bookTitle && (
                  <Badge variant="outline">
                    {bookTitle}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            
            {/* Tab Navigation */}
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 h-auto">
              <TabsTrigger value="exports" className="flex items-center gap-2 py-3">
                <Download className="h-4 w-4" />
                Export Data
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2 py-3">
                <FileText className="h-4 w-4" />
                PDF Reports
              </TabsTrigger>
              <TabsTrigger value="sharing" className="flex items-center gap-2 py-3">
                <Share2 className="h-4 w-4" />
                Share & Collaborate
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2 py-3">
                <Settings className="h-4 w-4" />
                Privacy & Security
              </TabsTrigger>
            </TabsList>

            {/* Export Data Tab */}
            <TabsContent value="exports" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ExportFormatsGrid />
              </motion.div>
            </TabsContent>

            {/* PDF Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ReportTemplatesGrid />
              </motion.div>
            </TabsContent>

            {/* Sharing Tab */}
            <TabsContent value="sharing" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ExportSharePanel 
                  onExportComplete={(type) => {
                    console.log(`${type} export completed`)
                  }}
                  onShareComplete={(url) => {
                    console.log('Share URL generated:', url)
                  }}
                />
              </motion.div>
            </TabsContent>

            {/* Privacy & Security Tab */}
            <TabsContent value="privacy" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <SecurityDashboard />
              </motion.div>
            </TabsContent>

          </Tabs>

        </motion.div>
      </div>
    </section>
  )
}

/**
 * Export formats grid
 */
function ExportFormatsGrid() {
  const { hasResults } = useAnalysisResults()

  const exportFormats = [
    {
      id: 'json',
      title: 'JSON Data',
      description: 'Complete analysis data in JSON format',
      icon: FileJson,
      format: '.json',
      size: '~500KB',
      useCase: 'Research, further analysis, backup',
      features: ['Complete dataset', 'Machine readable', 'Version controlled'],
      action: 'Export JSON'
    },
    {
      id: 'csv',
      title: 'CSV Network',
      description: 'Character network data for Gephi/R analysis',
      icon: FileSpreadsheet,
      format: '.csv',
      size: '~50KB',
      useCase: 'Gephi, R, Python analysis',
      features: ['Nodes & edges', 'Network metrics', 'Gephi compatible'],
      action: 'Export CSV'
    },
    {
      id: 'png',
      title: 'Network Image',
      description: 'High-resolution network visualization',
      icon: Image,
      format: '.png',
      size: '~2MB',
      useCase: 'Presentations, publications',
      features: ['High resolution', 'Publication ready', 'Transparent background'],
      action: 'Export PNG'
    },
    {
      id: 'gexf',
      title: 'GEXF Graph',
      description: 'Graph Exchange XML Format for network tools',
      icon: Network,
      format: '.gexf',
      size: '~100KB',
      useCase: 'Gephi, Cytoscape, NetworkX',
      features: ['Standard format', 'Preserves attributes', 'Tool compatible'],
      action: 'Export GEXF'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {exportFormats.map((format) => (
        <Card key={format.id} className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <format.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{format.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {format.format}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {format.size}
                  </Badge>
                </div>
              </div>
            </CardTitle>
            <CardDescription>{format.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Best for:</p>
              <p className="text-sm text-muted-foreground">{format.useCase}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Features:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {format.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-primary rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <Button 
              className="w-full" 
              disabled={!hasResults}
              variant={hasResults ? 'default' : 'secondary'}
            >
              <Download className="h-4 w-4 mr-2" />
              {format.action}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Report templates grid
 */
function ReportTemplatesGrid() {
  const { hasResults, characters, bookTitle } = useAnalysisResults()

  const reportTemplates = [
    {
      id: 'executive',
      title: 'Executive Summary',
      description: 'Concise overview with key insights',
      icon: BarChart3,
      pages: '3-5 pages',
      includes: ['Key statistics', 'Top characters', 'Network overview', 'Summary insights'],
      audience: 'Business, presentations',
      action: 'Generate Summary'
    },
    {
      id: 'academic',
      title: 'Academic Report',
      description: 'Comprehensive analysis for research',
      icon: FileText,
      pages: '10-15 pages',
      includes: ['Methodology', 'Detailed analysis', 'Network metrics', 'References', 'Appendices'],
      audience: 'Research, academic papers',
      action: 'Generate Academic Report'
    },
    {
      id: 'visual',
      title: 'Visual Dashboard',
      description: 'Image-heavy report with visualizations',
      icon: Image,
      pages: '5-8 pages',
      includes: ['Network graphs', 'Character timelines', 'Quote sentiment', 'Topic clouds'],
      audience: 'Presentations, social media',
      action: 'Generate Visual Report'
    },
    {
      id: 'comparison',
      title: 'Comparative Analysis',
      description: 'Multi-book comparison report',
      icon: Network,
      pages: '8-12 pages',
      includes: ['Side-by-side metrics', 'Character overlap', 'Style comparison', 'Trend analysis'],
      audience: 'Literary analysis, research',
      action: 'Generate Comparison'
    }
  ]

  return (
    <div className="space-y-6">
      
      {/* Quick Stats */}
      {hasResults && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{characters?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Characters</div>
              </div>
              <div>
                <div className="text-2xl font-bold">∞</div>
                <div className="text-sm text-muted-foreground">Connections</div>
              </div>
              <div>
                <div className="text-2xl font-bold">Ready</div>
                <div className="text-sm text-muted-foreground">Status</div>
              </div>
              <div>
                <div className="text-2xl font-bold">PDF</div>
                <div className="text-sm text-muted-foreground">Format</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTemplates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-secondary/50 rounded-lg">
                  <template.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{template.title}</h3>
                  <Badge variant="outline" className="text-xs mt-1">
                    {template.pages}
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Includes:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {template.includes.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-secondary rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Target Audience:</p>
                <p className="text-sm text-muted-foreground">{template.audience}</p>
              </div>

              <Button 
                className="w-full" 
                disabled={!hasResults}
                variant={hasResults ? 'default' : 'secondary'}
              >
                <FileText className="h-4 w-4 mr-2" />
                {template.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  )
}
