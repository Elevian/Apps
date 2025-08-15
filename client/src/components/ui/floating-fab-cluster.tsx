import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Palette, 
  Globe, 
  Command, 
  Plus, 
  X,
  Sun,
  Moon,
  Laptop,
  Languages,
  Zap
} from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { PrivacyStatusIndicator } from '@/components/ui/privacy-settings-panel'

export interface FloatingFABClusterProps {
  onCommandPaletteOpen?: () => void
  className?: string
}

export function FloatingFABCluster({
  onCommandPaletteOpen,
  className = ''
}: FloatingFABClusterProps) {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Laptop, label: 'System' }
  ]

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' }
  ]

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark' | 'system')
    setIsExpanded(false)
  }

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode)
    setIsExpanded(false)
  }

  const handleCommandPalette = () => {
    onCommandPaletteOpen?.()
    setIsExpanded(false)
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Privacy Status Mini-Indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute -top-12 right-0"
      >
        <PrivacyStatusIndicator className="text-xs" />
      </motion.div>

      {/* Expanded FAB Items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 right-0 space-y-3"
          >
            
            {/* Command Palette FAB */}
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              transition={{ delay: 0.1 }}
            >
              <Button
                size="sm"
                onClick={handleCommandPalette}
                className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                title="Command Palette (Ctrl+K)"
              >
                <Command className="h-4 w-4 mr-2" />
                Commands
              </Button>
            </motion.div>

            {/* Language Switcher FABs */}
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  size="sm"
                  variant={i18n.language === lang.code ? 'default' : 'outline'}
                  onClick={() => handleLanguageChange(lang.code)}
                  className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 min-w-[100px]"
                  title={`Switch to ${lang.label}`}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.label}
                </Button>
              ))}
            </motion.div>

            {/* Theme Switcher FABs */}
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              {themes.map((themeOption) => (
                <Button
                  key={themeOption.value}
                  size="sm"
                  variant={theme === themeOption.value ? 'default' : 'outline'}
                  onClick={() => handleThemeChange(themeOption.value)}
                  className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 min-w-[100px]"
                  title={`Switch to ${themeOption.label} theme`}
                >
                  <themeOption.icon className="h-4 w-4 mr-2" />
                  {themeOption.label}
                </Button>
              ))}
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Toggle */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="lg"
          onClick={toggleExpanded}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          title={isExpanded ? 'Close quick actions' : 'Open quick actions'}
        >
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Plus className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Quick Access Hints */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 2 }}
            className="absolute -top-8 right-0 text-xs text-muted-foreground bg-popover border rounded px-2 py-1 shadow-sm"
          >
            Quick Actions
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Compact version for mobile or smaller screens
 */
export function CompactFABCluster({
  onCommandPaletteOpen,
  className = ''
}: FloatingFABClusterProps) {
  const { theme, setTheme } = useTheme()
  const { i18n } = useTranslation()

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex] as 'light' | 'dark' | 'system')
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en'
    i18n.changeLanguage(newLang)
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col gap-2 ${className}`}>
      
      {/* Command Palette */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="sm"
          onClick={onCommandPaletteOpen}
          className="rounded-full w-10 h-10 shadow-lg hover:shadow-xl transition-all duration-200"
          title="Command Palette (Ctrl+K)"
        >
          <Command className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Language Toggle */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="sm"
          variant="outline"
          onClick={toggleLanguage}
          className="rounded-full w-10 h-10 shadow-lg hover:shadow-xl transition-all duration-200"
          title={`Switch to ${i18n.language === 'en' ? 'Arabic' : 'English'}`}
        >
          <Languages className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Theme Toggle */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="sm"
          variant="outline"
          onClick={cycleTheme}
          className="rounded-full w-10 h-10 shadow-lg hover:shadow-xl transition-all duration-200"
          title={`Current: ${theme} theme`}
        >
          {theme === 'light' ? (
            <Sun className="h-4 w-4" />
          ) : theme === 'dark' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Laptop className="h-4 w-4" />
          )}
        </Button>
      </motion.div>

      {/* Privacy Status */}
      <div className="mt-2">
        <PrivacyStatusIndicator className="text-xs" />
      </div>
    </div>
  )
}

/**
 * Hook for keyboard shortcuts
 */
export function useFABKeyboardShortcuts(onCommandPaletteOpen?: () => void) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K for command palette
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        onCommandPaletteOpen?.()
      }

      // Ctrl/Cmd + Shift + T for theme cycling
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault()
        // This would need to be connected to theme context
        console.log('Theme cycle shortcut triggered')
      }

      // Ctrl/Cmd + Shift + L for language toggle
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'L') {
        event.preventDefault()
        // This would need to be connected to i18n
        console.log('Language toggle shortcut triggered')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCommandPaletteOpen])
}
