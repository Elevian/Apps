import { Workbox } from 'workbox-window'

export interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOffline: boolean
  hasUpdate: boolean
  isLoading: boolean
  supportsInstall: boolean
}

export interface PWAUpdateInfo {
  available: boolean
  waiting: boolean
  installing: boolean
}

export class PWAManager {
  private wb: Workbox | null = null
  private deferredPrompt: any = null
  private updateCallback?: (info: PWAUpdateInfo) => void
  private stateCallback?: (state: PWAState) => void

  constructor() {
    this.initialize()
  }

  private async initialize() {
    // Initialize service worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      this.wb = new Workbox('/sw.js')
      this.setupServiceWorkerListeners()
      await this.wb.register()
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.deferredPrompt = e
      this.notifyStateChange()
    })

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null
      this.notifyStateChange()
    })

    // Listen for online/offline
    window.addEventListener('online', () => this.notifyStateChange())
    window.addEventListener('offline', () => this.notifyStateChange())
  }

  private setupServiceWorkerListeners() {
    if (!this.wb) return

    // Service worker waiting
    this.wb.addEventListener('waiting', () => {
      this.updateCallback?.({
        available: true,
        waiting: true,
        installing: false
      })
    })

    // Service worker installing
    this.wb.addEventListener('installing', () => {
      this.updateCallback?.({
        available: true,
        waiting: false,
        installing: true
      })
    })

    // Service worker controlling
    this.wb.addEventListener('controlling', () => {
      // Reload to get new content
      window.location.reload()
    })
  }

  /**
   * Get current PWA state
   */
  getState(): PWAState {
    return {
      isInstallable: !!this.deferredPrompt,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches ||
                   (window.navigator as any).standalone === true,
      isOffline: !navigator.onLine,
      hasUpdate: false, // Will be updated by service worker events
      isLoading: false,
      supportsInstall: 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window
    }
  }

  /**
   * Install PWA
   */
  async install(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false
    }

    try {
      this.deferredPrompt.prompt()
      const result = await this.deferredPrompt.userChoice
      
      if (result.outcome === 'accepted') {
        this.deferredPrompt = null
        this.notifyStateChange()
        return true
      }
      
      return false
    } catch (error) {
      console.error('PWA install failed:', error)
      return false
    }
  }

  /**
   * Update service worker
   */
  async update(): Promise<void> {
    if (!this.wb) return

    // Skip waiting and claim clients
    this.wb.messageSkipWaiting()
  }

  /**
   * Register state change callback
   */
  onStateChange(callback: (state: PWAState) => void): void {
    this.stateCallback = callback
    // Immediately call with current state
    callback(this.getState())
  }

  /**
   * Register update callback
   */
  onUpdateAvailable(callback: (info: PWAUpdateInfo) => void): void {
    this.updateCallback = callback
  }

  /**
   * Check if app is running in standalone mode
   */
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }

  /**
   * Show install instructions based on platform
   */
  getInstallInstructions(): {
    platform: string
    instructions: string[]
  } {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (/iphone|ipad/.test(userAgent)) {
      return {
        platform: 'iOS',
        instructions: [
          'Tap the Share button at the bottom of the screen',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" in the top right corner'
        ]
      }
    }
    
    if (/android/.test(userAgent)) {
      return {
        platform: 'Android',
        instructions: [
          'Tap the menu button (⋮) in your browser',
          'Tap "Install app" or "Add to Home Screen"',
          'Tap "Install" to confirm'
        ]
      }
    }
    
    return {
      platform: 'Desktop',
      instructions: [
        'Look for the install button in your browser\'s address bar',
        'Click the install button',
        'Follow the prompts to install the app'
      ]
    }
  }

  /**
   * Get offline capabilities info
   */
  getOfflineInfo(): {
    cacheSize: string
    lastUpdate: string
    cachedPages: string[]
  } {
    // This would be enhanced with actual cache inspection
    return {
      cacheSize: 'Calculating...',
      lastUpdate: new Date().toLocaleDateString(),
      cachedPages: [
        'Main Application',
        'Last 5 analyzed books',
        'Analysis results',
        'Static assets'
      ]
    }
  }

  private notifyStateChange(): void {
    if (this.stateCallback) {
      this.stateCallback(this.getState())
    }
  }
}

// Singleton instance
export const pwaManager = new PWAManager()

// Hook for React components
export function usePWA() {
  const [state, setState] = React.useState<PWAState>(pwaManager.getState())
  const [updateInfo, setUpdateInfo] = React.useState<PWAUpdateInfo>({
    available: false,
    waiting: false,
    installing: false
  })

  React.useEffect(() => {
    pwaManager.onStateChange(setState)
    pwaManager.onUpdateAvailable(setUpdateInfo)
  }, [])

  const install = React.useCallback(() => pwaManager.install(), [])
  const update = React.useCallback(() => pwaManager.update(), [])
  const getInstructions = React.useCallback(() => pwaManager.getInstallInstructions(), [])
  const getOfflineInfo = React.useCallback(() => pwaManager.getOfflineInfo(), [])

  return {
    state,
    updateInfo,
    install,
    update,
    getInstructions,
    getOfflineInfo,
    isStandalone: pwaManager.isStandalone()
  }
}

// Add React import for the hook
import * as React from 'react'
