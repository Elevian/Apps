import React, { useCallback, useMemo } from 'react'
import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  KBarResults,
  useMatches,
  useKBar,
  Action,
  createAction
} from 'kbar'
import { 
  BookOpen,
  GitCompareArrows,
  Eye,
  EyeOff,
  Download,
  Zap,
  RefreshCw,
  Palette,
  Globe,
  Users,
  Network,
  BarChart3,
  FileImage,
  FileJson,
  Database,
  Sparkles,
  Brain,
  Sun,
  Moon,
  Laptop,
  Search,
  Settings,
  Copy,
  Share2
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

export interface CommandPaletteProps {
  children: React.ReactNode
  onAnalyzeBook?: (bookId: string) => void
  onToggleLabels?: () => void
  onToggleCompareMode?: () => void
  onExportPNG?: () => void
  onExportJSON?: () => void
  onExportCSV?: () => void
  onForceRecompute?: () => void
  onGenerateGuide?: () => void
  onDisambiguateNames?: () => void
  currentBookId?: string
  showLabels?: boolean
  isAnalyzing?: boolean
}

export function CommandPalette({
  children,
  onAnalyzeBook,
  onToggleLabels,
  onToggleCompareMode,
  onExportPNG,
  onExportJSON,
  onExportCSV,
  onForceRecompute,
  onGenerateGuide,
  onDisambiguateNames,
  currentBookId,
  showLabels = true,
  isAnalyzing = false
}: CommandPaletteProps) {
  
  const { setTheme, theme } = useTheme()

  // Define all available actions
  const actions = useMemo((): Action[] => [
    // Analysis Actions
    {
      id: 'analyze',
      name: 'Analyze Book',
      shortcut: ['a', 'n'],
      keywords: 'analyze book gutenberg character analysis new',
      section: 'Analysis',
      icon: <BookOpen className="h-4 w-4" />,
      perform: () => {
        const bookId = prompt('Enter Gutenberg Book ID (e.g., 1342 for Pride and Prejudice):')
        if (bookId && /^\d+$/.test(bookId.trim())) {
          onAnalyzeBook?.(bookId.trim())
          toast.success(`Starting analysis of book ${bookId}`)
        } else if (bookId) {
          toast.error('Please enter a valid numeric book ID')
        }
      }
    },
    {
      id: 'force-recompute',
      name: 'Force Re-compute Analysis',
      shortcut: ['f', 'r'],
      keywords: 'force recompute analysis refresh cache clear',
      section: 'Analysis',
      icon: <Zap className="h-4 w-4" />,
      perform: () => {
        if (currentBookId) {
          onForceRecompute?.()
          toast.success('Force re-computing analysis...')
        } else {
          toast.error('No book currently analyzed')
        }
      }
    },
    {
      id: 'compare-books',
      name: 'Compare Two Books',
      shortcut: ['c', 'm'],
      keywords: 'compare books comparison side by side',
      section: 'Analysis',
      icon: <GitCompareArrows className="h-4 w-4" />,
      perform: () => {
        onToggleCompareMode?.()
        toast.info('Compare mode toggled')
      }
    },
    {
      id: 'disambiguate-names',
      name: 'Disambiguate Character Names',
      shortcut: ['d', 'n'],
      keywords: 'disambiguate names characters merge aliases',
      section: 'Analysis',
      icon: <Users className="h-4 w-4" />,
      perform: () => {
        onDisambiguateNames?.()
        toast.info('Name disambiguation helper opened')
      }
    },
    {
      id: 'generate-guide',
      name: 'Generate Reading Guide',
      shortcut: ['g', 'r'],
      keywords: 'generate reading guide summaries chapters ai',
      section: 'Analysis',
      icon: <Sparkles className="h-4 w-4" />,
      perform: () => {
        onGenerateGuide?.()
        toast.info('Generating reading guide...')
      }
    },

    // Visualization Actions
    {
      id: 'toggle-labels',
      name: showLabels ? 'Hide Node Labels' : 'Show Node Labels',
      shortcut: ['l'],
      keywords: 'toggle labels nodes show hide visibility',
      section: 'Visualization',
      icon: showLabels ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />,
      perform: () => {
        onToggleLabels?.()
        toast.info(showLabels ? 'Node labels hidden' : 'Node labels shown')
      }
    },
    {
      id: 'fit-view',
      name: 'Fit Graph to View',
      shortcut: ['f', 'v'],
      keywords: 'fit view zoom graph center',
      section: 'Visualization',
      icon: <Network className="h-4 w-4" />,
      perform: () => {
        // This would need to be connected to the graph component
        toast.info('Fitting graph to view')
      }
    },
    {
      id: 'reset-layout',
      name: 'Reset Graph Layout',
      shortcut: ['r', 'l'],
      keywords: 'reset layout graph positions simulation',
      section: 'Visualization',
      icon: <RefreshCw className="h-4 w-4" />,
      perform: () => {
        toast.info('Resetting graph layout')
      }
    },

    // Export Actions
    {
      id: 'export-png',
      name: 'Export Graph as PNG',
      shortcut: ['e', 'p'],
      keywords: 'export png image graph screenshot',
      section: 'Export',
      icon: <FileImage className="h-4 w-4" />,
      perform: () => {
        onExportPNG?.()
        toast.success('Exporting graph as PNG...')
      }
    },
    {
      id: 'export-json',
      name: 'Export Data as JSON',
      shortcut: ['e', 'j'],
      keywords: 'export json data graph nodes edges',
      section: 'Export',
      icon: <FileJson className="h-4 w-4" />,
      perform: () => {
        onExportJSON?.()
        toast.success('Exporting data as JSON...')
      }
    },
    {
      id: 'export-csv',
      name: 'Export Data as CSV',
      shortcut: ['e', 'c'],
      keywords: 'export csv spreadsheet data analysis',
      section: 'Export',
      icon: <Database className="h-4 w-4" />,
      perform: () => {
        onExportCSV?.()
        toast.success('Exporting data as CSV...')
      }
    },
    {
      id: 'copy-analysis-link',
      name: 'Copy Analysis Link',
      shortcut: ['c', 'l'],
      keywords: 'copy link share analysis url',
      section: 'Export',
      icon: <Copy className="h-4 w-4" />,
      perform: () => {
        if (currentBookId) {
          const url = `${window.location.origin}${window.location.pathname}?book=${currentBookId}`
          navigator.clipboard.writeText(url).then(() => {
            toast.success('Analysis link copied to clipboard')
          }).catch(() => {
            toast.error('Failed to copy link')
          })
        } else {
          toast.error('No book currently analyzed')
        }
      }
    },

    // Theme Actions
    {
      id: 'theme-light',
      name: 'Switch to Light Theme',
      shortcut: ['t', 'l'],
      keywords: 'theme light mode bright',
      section: 'Appearance',
      icon: <Sun className="h-4 w-4" />,
      perform: () => {
        setTheme('light')
        toast.info('Switched to light theme')
      }
    },
    {
      id: 'theme-dark',
      name: 'Switch to Dark Theme',
      shortcut: ['t', 'd'],
      keywords: 'theme dark mode night',
      section: 'Appearance',
      icon: <Moon className="h-4 w-4" />,
      perform: () => {
        setTheme('dark')
        toast.info('Switched to dark theme')
      }
    },
    {
      id: 'theme-system',
      name: 'Use System Theme',
      shortcut: ['t', 's'],
      keywords: 'theme system auto',
      section: 'Appearance',
      icon: <Laptop className="h-4 w-4" />,
      perform: () => {
        setTheme('system')
        toast.info('Using system theme')
      }
    },

    // Navigation Actions
    {
      id: 'scroll-to-graph',
      name: 'Go to Graph Section',
      shortcut: ['g', 'g'],
      keywords: 'scroll graph network visualization',
      section: 'Navigation',
      icon: <Network className="h-4 w-4" />,
      perform: () => {
        document.getElementById('graph')?.scrollIntoView({ behavior: 'smooth' })
        toast.info('Scrolled to graph section')
      }
    },
    {
      id: 'scroll-to-insights',
      name: 'Go to Insights Section',
      shortcut: ['g', 'i'],
      keywords: 'scroll insights analysis results',
      section: 'Navigation',
      icon: <BarChart3 className="h-4 w-4" />,
      perform: () => {
        document.getElementById('insights')?.scrollIntoView({ behavior: 'smooth' })
        toast.info('Scrolled to insights section')
      }
    },
    {
      id: 'scroll-to-analyzer',
      name: 'Go to Analyzer Section',
      shortcut: ['g', 'a'],
      keywords: 'scroll analyzer input book id',
      section: 'Navigation',
      icon: <Search className="h-4 w-4" />,
      perform: () => {
        document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth' })
        toast.info('Scrolled to analyzer section')
      }
    },

    // Help Actions
    {
      id: 'keyboard-shortcuts',
      name: 'Show Keyboard Shortcuts',
      shortcut: ['?'],
      keywords: 'help shortcuts keyboard commands',
      section: 'Help',
      icon: <Settings className="h-4 w-4" />,
      perform: () => {
        toast.info('Press Cmd/Ctrl+K to open command palette, then type to search')
      }
    },
    {
      id: 'about',
      name: 'About Gutenberg Insights',
      keywords: 'about info application version',
      section: 'Help',
      icon: <BookOpen className="h-4 w-4" />,
      perform: () => {
        toast.info('Gutenberg Character Analysis - Discover relationships in literature')
      }
    }
  ], [
    showLabels, 
    currentBookId, 
    onAnalyzeBook, 
    onToggleLabels, 
    onToggleCompareMode,
    onExportPNG, 
    onExportJSON, 
    onExportCSV, 
    onForceRecompute,
    onGenerateGuide, 
    onDisambiguateNames, 
    setTheme
  ])

  return (
    <KBarProvider actions={actions}>
      <KBarPortal>
        <KBarPositioner className="backdrop-blur-sm bg-background/80">
          <KBarAnimator className="max-w-2xl w-full bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <KBarSearch className="w-full bg-transparent border-0 outline-0 text-lg placeholder-muted-foreground" 
                placeholder="Search commands..." 
              />
            </div>
            <RenderResults />
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </KBarProvider>
  )
}

/**
 * Custom results renderer with sections
 */
function RenderResults() {
  const { results, rootActionId } = useMatches()

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === "string" ? (
          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
            {item}
          </div>
        ) : (
          <div
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
              active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
            }`}
          >
            {item.icon && (
              <div className="flex-shrink-0">
                {item.icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium">{item.name}</div>
              {item.subtitle && (
                <div className="text-sm text-muted-foreground">{item.subtitle}</div>
              )}
            </div>
            {item.shortcut && item.shortcut.length > 0 && (
              <div className="flex items-center gap-1">
                {item.shortcut.map((key, index) => (
                  <kbd
                    key={index}
                    className="px-2 py-1 text-xs bg-muted border border-border rounded"
                  >
                    {key.toUpperCase()}
                  </kbd>
                ))}
              </div>
            )}
          </div>
        )
      }
    />
  )
}

/**
 * Hook to programmatically open command palette
 */
export function useCommandPalette() {
  const { query } = useKBar()
  
  const openWithQuery = useCallback((initialQuery?: string) => {
    query.setSearch(initialQuery || '')
    query.toggle()
  }, [query])

  const toggle = useCallback(() => {
    query.toggle()
  }, [query])

  return {
    toggle,
    openWithQuery
  }
}

/**
 * Keyboard shortcut helper component
 */
export function KeyboardShortcuts() {
  const shortcuts = [
    { keys: ['Cmd/Ctrl', 'K'], description: 'Open command palette' },
    { keys: ['A', 'N'], description: 'Analyze new book' },
    { keys: ['C', 'M'], description: 'Compare books' },
    { keys: ['E', 'P'], description: 'Export as PNG' },
    { keys: ['L'], description: 'Toggle labels' },
    { keys: ['T', 'D'], description: 'Dark theme' },
    { keys: ['G', 'G'], description: 'Go to graph' },
    { keys: ['?'], description: 'Show shortcuts' }
  ]

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">Keyboard Shortcuts</h4>
      <div className="space-y-1">
        {shortcuts.map(({ keys, description }, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{description}</span>
            <div className="flex items-center gap-1">
              {keys.map((key, i) => (
                <kbd key={i} className="px-2 py-1 text-xs bg-muted border border-border rounded">
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
