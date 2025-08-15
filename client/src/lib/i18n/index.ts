import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import enTranslations from './locales/en.json'
import arTranslations from './locales/ar.json'

// Language detection configuration
const detectionOptions = {
  order: ['localStorage', 'navigator', 'htmlTag'],
  caches: ['localStorage'],
  lookupLocalStorage: 'gutenberg-language',
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      ar: {
        translation: arTranslations
      }
    },
    
    // Language detection
    detection: detectionOptions,
    
    // Fallback language
    fallbackLng: 'en',
    
    // Debugging
    debug: process.env.NODE_ENV === 'development',
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    // React options
    react: {
      useSuspense: false,
    },
    
    // Namespace options
    defaultNS: 'translation',
    ns: ['translation'],
  })

// Set RTL/LTR direction based on language
i18n.on('languageChanged', (lng) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.dir = dir
  document.documentElement.lang = lng
  
  // Store language preference
  localStorage.setItem('gutenberg-language', lng)
})

export default i18n

// Language utilities
export const isRTL = (language?: string) => {
  const lng = language || i18n.language
  return lng === 'ar'
}

export const getDirection = (language?: string) => {
  return isRTL(language) ? 'rtl' : 'ltr'
}

// Available languages
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' }
] as const

export type LanguageCode = typeof LANGUAGES[number]['code']
