import { Section } from '@/components/section'
import { Toaster } from '@/components/ui/toaster'
import { AnalysisProvider } from '@/contexts/analysis-context'

// Section Components
import { HeroSection } from '@/components/sections/hero-section'
import { EnhancedAnalyzerSection } from '@/components/sections/enhanced-analyzer-section'
import { LiveProgressSection } from '@/components/sections/live-progress-section'
import { EnhancedGraphSection } from '@/components/sections/enhanced-graph-section'
import { EnhancedInsightsSection } from '@/components/sections/enhanced-insights-section'
import { DiscoverySection } from '@/components/sections/discovery-section'
import { EnhancedReportExportsSection } from '@/components/sections/enhanced-report-exports-section'
import { AboutSection } from '@/components/sections/about-section'
import { ContactSection } from '@/components/sections/contact-section'
import { OfflineBanner, ConnectionStatus } from '@/components/ui/offline-banner'
import { CommandPalette } from '@/components/ui/command-palette'
import { EnhancedFooter } from '@/components/sections/enhanced-footer'
import { FloatingFABCluster, useFABKeyboardShortcuts } from '@/components/ui/floating-fab-cluster'
import { useKeyboardNavigation, useKeyboardDetection } from '@/hooks/use-keyboard-navigation'
import { SharedStateBanner, useSharedStateBanner } from '@/components/ui/shared-state-banner'
import { LegalDisclaimer, useLegalDisclaimer } from '@/components/ui/legal-disclaimer'

function App() {
  // Initialize keyboard navigation and detection
  useKeyboardNavigation()
  useKeyboardDetection()

  // Shared state banner management
  const { shouldShowBanner, dismissBanner } = useSharedStateBanner()

  // Legal disclaimer management
  const { shouldShowDisclaimer, acceptDisclaimer } = useLegalDisclaimer()

  // Command palette handler
  const handleCommandPaletteOpen = () => {
    // This would be connected to the CommandPalette context
    console.log('Opening command palette...')
  }

  // Initialize FAB keyboard shortcuts
  useFABKeyboardShortcuts(handleCommandPaletteOpen)

  return (
    <AnalysisProvider>
      <CommandPalette
        onAnalyzeBook={(bookId) => {
          // This will be connected to the analyzer section
          console.log('Analyze book:', bookId)
        }}
        onToggleLabels={() => {
          // This will be connected to the graph section
          console.log('Toggle labels')
        }}
        onToggleCompareMode={() => {
          // This will be connected to the comparison component
          console.log('Toggle compare mode')
        }}
        onExportPNG={() => {
          // This will be connected to the graph export
          console.log('Export PNG')
        }}
        onExportJSON={() => {
          // This will be connected to the data export
          console.log('Export JSON')
        }}
        onExportCSV={() => {
          // This will be connected to the data export
          console.log('Export CSV')
        }}
        onForceRecompute={() => {
          // This will be connected to the analyzer section
          console.log('Force recompute')
        }}
        onGenerateGuide={() => {
          // This will be connected to the reading guide
          console.log('Generate guide')
        }}
        onDisambiguateNames={() => {
          // This will be connected to the name disambiguation
          console.log('Disambiguate names')
        }}
      >
        <div className="min-h-screen bg-background">
        {/* Skip to main content link for screen readers */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>

        {/* Hero Section */}
        <Section 
          id="hero" 
          as="main"
          aria-label="Character analysis application introduction"
          className="min-h-screen flex items-center justify-center"
        >
          <HeroSection />
        </Section>

                {/* Main Application Content */}
        <main id="main-content">
          
          {/* 2. Analyzer Section */}
          <Section 
            id="analyzer" 
            background="muted"
            aria-labelledby="analyzer-heading"
          >
            <EnhancedAnalyzerSection />
          </Section>

          {/* 3. Live Progress Section */}
          <LiveProgressSection />

          {/* 4. Graph & Controls Section */}
          <Section 
            id="graph" 
            background="muted"
            aria-labelledby="graph-heading"
          >
            <EnhancedGraphSection />
          </Section>

          {/* 5. Insights Section (Top Characters, Quotes, Timelines, Topics) */}
          <Section 
            id="insights" 
            aria-labelledby="insights-heading"
          >
            <EnhancedInsightsSection />
          </Section>

          {/* 6. Compare Section (collapsible) */}
          <Section 
            id="compare" 
            background="muted"
            aria-labelledby="compare-heading"
          >
            <DiscoverySection />
          </Section>

          {/* 7. Report & Exports Section */}
          <EnhancedReportExportsSection />

        </main>

        {/* Complementary Information */}
        <aside>
          {/* About Section */}
          <Section 
            id="about"
            aria-labelledby="about-heading"
          >
            <AboutSection />
          </Section>

          {/* Contact Section */}
          <Section 
            id="contact" 
            background="muted"
            aria-labelledby="contact-heading"
          >
            <ContactSection />
          </Section>
        </aside>

        {/* Enhanced Footer */}
        <EnhancedFooter />

        {/* Legal Disclaimer Banner */}
        {shouldShowDisclaimer && (
          <LegalDisclaimer
            variant="banner"
            onAccept={acceptDisclaimer}
            className="fixed top-4 left-4 right-4 z-40 max-w-4xl mx-auto"
          />
        )}

        {/* Shared State Banner */}
        {shouldShowBanner && (
          <SharedStateBanner
            onApplyState={(state) => {
              console.log('Applying shared state:', state)
              // This would integrate with the analysis context to load the shared state
            }}
            onDismiss={dismissBanner}
          />
        )}

        {/* PWA and Offline Components */}
        <OfflineBanner />
        <ConnectionStatus />

        {/* Floating FAB Cluster (Theme, Language, Command Palette) */}
        <FloatingFABCluster onCommandPaletteOpen={handleCommandPaletteOpen} />
        
        {/* Live region for announcements */}
        <div 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
          id="announcement-region"
        />
        
        {/* Toaster for notifications */}
        <Toaster />
        </div>
      </CommandPalette>
    </AnalysisProvider>
  )
}

export default App
