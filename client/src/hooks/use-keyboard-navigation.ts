import { useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
  section?: string
}

export function useKeyboardNavigation(shortcuts: KeyboardShortcut[] = []) {
  const { t } = useTranslation()

  // Default keyboard shortcuts for navigation
  const defaultShortcuts: KeyboardShortcut[] = [
    {
      key: 'h',
      altKey: true,
      action: () => scrollToSection('hero'),
      description: t('navigation.sectionAnalyzer'),
      section: 'navigation'
    },
    {
      key: 'a',
      altKey: true,
      action: () => scrollToSection('analyzer'),
      description: t('navigation.sectionAnalyzer'),
      section: 'navigation'
    },
    {
      key: 'g',
      altKey: true,
      action: () => scrollToSection('graph'),
      description: t('navigation.sectionGraph'),
      section: 'navigation'
    },
    {
      key: 'i',
      altKey: true,
      action: () => scrollToSection('insights'),
      description: t('navigation.sectionInsights'),
      section: 'navigation'
    },
    {
      key: 'd',
      altKey: true,
      action: () => scrollToSection('discovery'),
      description: t('navigation.sectionDiscovery'),
      section: 'navigation'
    },
    {
      key: 'b',
      altKey: true,
      action: () => scrollToSection('about'),
      description: t('navigation.sectionAbout'),
      section: 'navigation'
    }
  ]

  const allShortcuts = [...defaultShortcuts, ...shortcuts]

  // Handle keydown events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if user is typing in an input
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true') {
      return
    }

    // Find matching shortcut
    const shortcut = allShortcuts.find(s => 
      s.key.toLowerCase() === event.key.toLowerCase() &&
      !!s.ctrlKey === event.ctrlKey &&
      !!s.altKey === event.altKey &&
      !!s.shiftKey === event.shiftKey &&
      !!s.metaKey === event.metaKey
    )

    if (shortcut) {
      event.preventDefault()
      shortcut.action()
      
      // Announce the action to screen readers
      announceToScreenReader(shortcut.description)
    }
  }, [allShortcuts])

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    shortcuts: allShortcuts,
    addShortcut: (shortcut: KeyboardShortcut) => {
      // This would require state management in a real implementation
      console.log('Adding shortcut:', shortcut)
    }
  }
}

/**
 * Scroll to a section with smooth behavior and focus management
 */
function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId)
  if (element) {
    // Smooth scroll to element
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start',
      inline: 'nearest'
    })

    // Focus the section for keyboard navigation
    // Try to focus the first focusable element in the section
    const focusableElement = element.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElement) {
      // Delay to allow scroll animation to complete
      setTimeout(() => {
        focusableElement.focus()
      }, 500)
    } else {
      // Make the section itself focusable temporarily
      element.setAttribute('tabindex', '-1')
      setTimeout(() => {
        element.focus()
        element.removeAttribute('tabindex')
      }, 500)
    }

    toast.success(`Navigated to ${sectionId} section`)
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

/**
 * Detect if user is navigating with keyboard
 */
export function useKeyboardDetection() {
  useEffect(() => {
    let isUsingKeyboard = false

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        isUsingKeyboard = true
        document.body.classList.add('keyboard-navigation')
      }
    }

    const handleMouseDown = () => {
      isUsingKeyboard = false
      document.body.classList.remove('keyboard-navigation')
    }

    const handleFocus = (event: FocusEvent) => {
      if (isUsingKeyboard && event.target instanceof HTMLElement) {
        // Add enhanced focus styling for keyboard users
        event.target.classList.add('keyboard-focus')
      }
    }

    const handleBlur = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement) {
        event.target.classList.remove('keyboard-focus')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('focus', handleFocus, true)
    document.addEventListener('blur', handleBlur, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('focus', handleFocus, true)
      document.removeEventListener('blur', handleBlur, true)
    }
  }, [])
}

/**
 * Focus trap for modal dialogs and popovers
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab - going backwards
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement?.focus()
          }
        } else {
          // Tab - going forwards
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement?.focus()
          }
        }
      } else if (event.key === 'Escape') {
        // Let parent handle escape
        event.stopPropagation()
      }
    }

    // Focus first element when trap activates
    if (firstElement) {
      firstElement.focus()
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [isActive, containerRef])
}

/**
 * Skip links for screen readers
 */
export function useSkipLinks() {
  const { t } = useTranslation()

  const skipLinks = [
    { href: '#main-content', label: t('navigation.skipToContent') },
    { href: '#analyzer', label: t('navigation.sectionAnalyzer') },
    { href: '#graph', label: t('navigation.sectionGraph') },
    { href: '#insights', label: t('navigation.sectionInsights') },
    { href: '#discovery', label: t('navigation.sectionDiscovery') }
  ]

  return skipLinks
}
