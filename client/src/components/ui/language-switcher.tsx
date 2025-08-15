import React from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Languages, Check } from 'lucide-react'
import { LANGUAGES, isRTL, type LanguageCode } from '@/lib/i18n'
import { toast } from 'sonner'

export interface LanguageSwitcherProps {
  variant?: 'default' | 'footer' | 'minimal'
  showFlag?: boolean
  className?: string
}

export function LanguageSwitcher({ 
  variant = 'default',
  showFlag = true,
  className = ''
}: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()
  
  const currentLanguage = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0]
  
  const handleLanguageChange = async (languageCode: LanguageCode) => {
    try {
      await i18n.changeLanguage(languageCode)
      
      // Update document attributes
      const newLang = LANGUAGES.find(lang => lang.code === languageCode)
      if (newLang) {
        document.documentElement.lang = languageCode
        document.documentElement.dir = isRTL(languageCode) ? 'rtl' : 'ltr'
        
        // Announce language change to screen readers
        const announcement = `${t('common.language')} ${t('success.saved')}: ${newLang.nativeName}`
        announceToScreenReader(announcement)
        
        toast.success(t('success.saved'))
      }
    } catch (error) {
      console.error('Failed to change language:', error)
      toast.error(t('errors.general'))
    }
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {LANGUAGES.map((language) => (
          <Button
            key={language.code}
            variant={currentLanguage.code === language.code ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleLanguageChange(language.code)}
            className="px-2 py-1 h-8"
            aria-label={`${t('common.language')}: ${language.nativeName}`}
          >
            {showFlag && <span className="mr-1">{language.flag}</span>}
            <span className="text-xs">{language.code.toUpperCase()}</span>
          </Button>
        ))}
      </div>
    )
  }

  if (variant === 'footer') {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <Languages className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{t('common.language')}:</span>
        <div className="flex gap-1">
          {LANGUAGES.map((language) => (
            <Button
              key={language.code}
              variant="link"
              size="sm"
              onClick={() => handleLanguageChange(language.code)}
              className={`px-2 py-1 h-auto text-xs hover:text-primary ${
                currentLanguage.code === language.code 
                  ? 'text-primary font-medium' 
                  : 'text-muted-foreground'
              }`}
              aria-label={`${t('common.language')}: ${language.nativeName}`}
            >
              {showFlag && <span className="mr-1">{language.flag}</span>}
              {language.nativeName}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${className}`}
          aria-label={`${t('common.language')}: ${currentLanguage.nativeName}`}
        >
          <Languages className="h-4 w-4" />
          {showFlag && <span>{currentLanguage.flag}</span>}
          <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
          <span className="sm:hidden">{currentLanguage.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        {LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {showFlag && <span>{language.flag}</span>}
              <div>
                <div className="font-medium">{language.nativeName}</div>
                <div className="text-xs text-muted-foreground">{language.name}</div>
              </div>
            </div>
            {currentLanguage.code === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * RTL-aware component wrapper
 */
export function RTLWrapper({ 
  children,
  className = ''
}: { 
  children: React.ReactNode
  className?: string
}) {
  const { i18n } = useTranslation()
  const isRTLLanguage = isRTL(i18n.language)
  
  return (
    <div 
      className={`${isRTLLanguage ? 'rtl' : 'ltr'} ${className}`}
      dir={isRTLLanguage ? 'rtl' : 'ltr'}
    >
      {children}
    </div>
  )
}

/**
 * RTL-aware motion div
 */
export function RTLMotionDiv({
  children,
  className = '',
  ...motionProps
}: {
  children: React.ReactNode
  className?: string
} & Parameters<typeof motion.div>[0]) {
  const { i18n } = useTranslation()
  const isRTLLanguage = isRTL(i18n.language)
  
  return (
    <motion.div
      className={`${isRTLLanguage ? 'rtl' : 'ltr'} ${className}`}
      dir={isRTLLanguage ? 'rtl' : 'ltr'}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}

/**
 * Hook for RTL-aware styling
 */
export function useRTL() {
  const { i18n } = useTranslation()
  
  return {
    isRTL: isRTL(i18n.language),
    direction: isRTL(i18n.language) ? 'rtl' : 'ltr',
    textAlign: isRTL(i18n.language) ? 'text-right' : 'text-left',
    flexDirection: isRTL(i18n.language) ? 'flex-row-reverse' : 'flex-row',
    marginLeft: (value: string) => isRTL(i18n.language) ? `mr-${value}` : `ml-${value}`,
    marginRight: (value: string) => isRTL(i18n.language) ? `ml-${value}` : `mr-${value}`,
    paddingLeft: (value: string) => isRTL(i18n.language) ? `pr-${value}` : `pl-${value}`,
    paddingRight: (value: string) => isRTL(i18n.language) ? `pl-${value}` : `pr-${value}`,
    borderLeft: (value: string) => isRTL(i18n.language) ? `border-r-${value}` : `border-l-${value}`,
    borderRight: (value: string) => isRTL(i18n.language) ? `border-l-${value}` : `border-r-${value}`,
    roundedLeft: (value: string) => isRTL(i18n.language) ? `rounded-r-${value}` : `rounded-l-${value}`,
    roundedRight: (value: string) => isRTL(i18n.language) ? `rounded-l-${value}` : `rounded-r-${value}`,
  }
}

/**
 * Announce message to screen readers
 */
function announceToScreenReader(message: string) {
  const announcement = document.getElementById('announcement-region')
  if (announcement) {
    announcement.textContent = message
    // Clear after a delay
    setTimeout(() => {
      announcement.textContent = ''
    }, 1000)
  }
}
