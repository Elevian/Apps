import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { LanguageSwitcher, useRTL } from '@/components/ui/language-switcher'
import { LegalDisclaimer, useLegalDisclaimer } from '@/components/ui/legal-disclaimer'
import { 
  Heart,
  Coffee,
  Github,
  BookOpen,
  Palette,
  Globe,
  Accessibility,
  Eye
} from 'lucide-react'

export function EnhancedFooter() {
  const { t } = useTranslation()
  const { isRTL, textAlign } = useRTL()

  const currentYear = new Date().getFullYear()
  const version = '2.0.0' // This would come from package.json in a real app

  const features = [
    { icon: Accessibility, text: 'WCAG 2.1 AA+' },
    { icon: Globe, text: 'i18n RTL Support' },
    { icon: Eye, text: 'Reduced Motion' },
    { icon: Palette, text: 'High Contrast' }
  ]

  const technologies = [
    'React', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 
    'Framer Motion', 'D3.js', 'Web Workers', 'PWA'
  ]

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        
        {/* Main Footer Content */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 ${textAlign}`}>
          
          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('footer.poweredBy')} Gutenberg Insights
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {t('hero.description')}
            </p>
            <div className="flex flex-wrap gap-2">
              {features.map(({ icon: Icon, text }, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Icon className="h-3 w-3 mr-1" />
                  {text}
                </Badge>
              ))}
            </div>
          </motion.div>

          {/* Technology Stack */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="font-semibold text-lg mb-3">
              {t('footer.madeWith')} ❤️
            </h3>
            <div className="flex flex-wrap gap-2">
              {technologies.map((tech, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coffee className="h-4 w-4" />
                <span>{t('footer.openSource')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Github className="h-4 w-4" />
                <span>{t('footer.version')} {version}</span>
              </div>
            </div>
          </motion.div>

          {/* Settings & Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-semibold text-lg mb-3">
              {t('common.settings')}
            </h3>
            
            {/* Language Switcher */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('common.language')}
                </label>
                <LanguageSwitcher variant="footer" />
              </div>

              {/* Accessibility Info */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Alt+A: {t('navigation.sectionAnalyzer')}</p>
                <p>• Alt+G: {t('navigation.sectionGraph')}</p>
                <p>• Alt+I: {t('navigation.sectionInsights')}</p>
                <p>• Ctrl/Cmd+K: {t('commandPalette.placeholder')}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <Separator className="mb-6" />

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground ${
            isRTL ? 'sm:flex-row-reverse' : ''
          }`}
        >
          <div className="flex items-center gap-4">
            <span>© {currentYear} Gutenberg Character Analysis</span>
            <span>•</span>
            <span>{t('footer.madeWith')} ❤️ for literature enthusiasts</span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </a>
            </Button>
            
            <div className="flex items-center gap-1 text-xs">
              <span>{t('accessibility.announcements')}:</span>
              <Badge variant="secondary" className="text-xs">
                ARIA Live
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* RTL Debug Info (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-4 p-2 bg-muted/50 rounded text-xs text-muted-foreground"
          >
            <div className="flex items-center gap-4">
              <span>Direction: {isRTL ? 'RTL (العربية)' : 'LTR (English)'}</span>
              <span>•</span>
              <span>Document Dir: {document.documentElement.dir || 'auto'}</span>
              <span>•</span>
              <span>Language: {document.documentElement.lang || 'en'}</span>
            </div>
          </motion.div>
        )}

        {/* Legal Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8"
        >
          <LegalDisclaimer variant="compact" />
        </motion.div>
      </div>
    </footer>
  )
}
