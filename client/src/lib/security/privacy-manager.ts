/**
 * Privacy and Security Manager
 * Handles local-only mode, network restrictions, and data privacy
 */

export interface PrivacySettings {
  localOnlyMode: boolean           // Disable all external network calls
  allowGutenbergAPI: boolean       // Allow Project Gutenberg API calls
  allowOllamaLocal: boolean        // Allow localhost Ollama calls only
  allowAnalytics: boolean          // Allow usage analytics (if implemented)
  allowCaching: boolean            // Allow IndexedDB caching
  allowSharing: boolean            // Allow URL sharing features
  dataRetentionDays: number        // How long to keep cached data
  requireExplicitConsent: boolean  // Require consent for each network operation
}

export interface NetworkRequest {
  url: string
  type: 'gutenberg' | 'ollama' | 'analytics' | 'external'
  purpose: string
  required: boolean
}

export class PrivacyManager {
  private static readonly STORAGE_KEY = 'gutenberg-insights-privacy'
  private static readonly DEFAULT_SETTINGS: PrivacySettings = {
    localOnlyMode: false,
    allowGutenbergAPI: true,
    allowOllamaLocal: true,
    allowAnalytics: false,
    allowCaching: true,
    allowSharing: true,
    dataRetentionDays: 30,
    requireExplicitConsent: false
  }

  private settings: PrivacySettings
  private listeners: Array<(settings: PrivacySettings) => void> = []

  constructor() {
    this.settings = this.loadSettings()
    this.enforceDataRetention()
  }

  /**
   * Get current privacy settings
   */
  getSettings(): PrivacySettings {
    return { ...this.settings }
  }

  /**
   * Update privacy settings
   */
  updateSettings(updates: Partial<PrivacySettings>): void {
    const oldSettings = { ...this.settings }
    this.settings = { ...this.settings, ...updates }
    
    // If local-only mode is enabled, disable external features
    if (this.settings.localOnlyMode) {
      this.settings.allowAnalytics = false
      this.settings.allowSharing = false
    }
    
    this.saveSettings()
    this.notifyListeners()
    
    // Handle special transitions
    this.handleSettingsChange(oldSettings, this.settings)
  }

  /**
   * Check if a network request is allowed
   */
  isNetworkRequestAllowed(request: NetworkRequest): boolean {
    // In local-only mode, only allow essential Gutenberg calls
    if (this.settings.localOnlyMode) {
      return request.type === 'gutenberg' && request.required
    }

    switch (request.type) {
      case 'gutenberg':
        return this.settings.allowGutenbergAPI
      
      case 'ollama':
        // Only allow localhost Ollama calls
        const isLocalhost = this.isLocalhostURL(request.url)
        return this.settings.allowOllamaLocal && isLocalhost
      
      case 'analytics':
        return this.settings.allowAnalytics
      
      case 'external':
        return !this.settings.localOnlyMode
      
      default:
        return false
    }
  }

  /**
   * Request permission for a network operation
   */
  async requestNetworkPermission(request: NetworkRequest): Promise<boolean> {
    // Check if already allowed
    if (this.isNetworkRequestAllowed(request)) {
      return true
    }

    // If explicit consent is required, show permission dialog
    if (this.settings.requireExplicitConsent) {
      return this.showPermissionDialog(request)
    }

    return false
  }

  /**
   * Check if caching is allowed
   */
  isCachingAllowed(): boolean {
    return this.settings.allowCaching && !this.settings.localOnlyMode
  }

  /**
   * Check if sharing features are allowed
   */
  isSharingAllowed(): boolean {
    return this.settings.allowSharing && !this.settings.localOnlyMode
  }

  /**
   * Get data retention policy
   */
  getDataRetentionDays(): number {
    return this.settings.dataRetentionDays
  }

  /**
   * Subscribe to settings changes
   */
  onSettingsChange(listener: (settings: PrivacySettings) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Export privacy settings for backup
   */
  exportSettings(): string {
    return JSON.stringify({
      settings: this.settings,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    }, null, 2)
  }

  /**
   * Import privacy settings from backup
   */
  importSettings(settingsJson: string): boolean {
    try {
      const data = JSON.parse(settingsJson)
      if (data.settings && typeof data.settings === 'object') {
        this.updateSettings(data.settings)
        return true
      }
    } catch (error) {
      console.error('Failed to import privacy settings:', error)
    }
    return false
  }

  /**
   * Reset to default settings
   */
  resetToDefaults(): void {
    this.settings = { ...PrivacyManager.DEFAULT_SETTINGS }
    this.saveSettings()
    this.notifyListeners()
  }

  /**
   * Get privacy compliance summary
   */
  getComplianceSummary(): {
    localOnlyMode: boolean
    externalCallsBlocked: number
    dataRetentionCompliant: boolean
    analyticsDisabled: boolean
  } {
    return {
      localOnlyMode: this.settings.localOnlyMode,
      externalCallsBlocked: this.getBlockedCallsCount(),
      dataRetentionCompliant: this.settings.dataRetentionDays <= 365,
      analyticsDisabled: !this.settings.allowAnalytics
    }
  }

  /**
   * Private methods
   */
  private loadSettings(): PrivacySettings {
    try {
      const stored = localStorage.getItem(PrivacyManager.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...PrivacyManager.DEFAULT_SETTINGS, ...parsed }
      }
    } catch (error) {
      console.warn('Failed to load privacy settings:', error)
    }
    return { ...PrivacyManager.DEFAULT_SETTINGS }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(PrivacyManager.STORAGE_KEY, JSON.stringify(this.settings))
    } catch (error) {
      console.error('Failed to save privacy settings:', error)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getSettings())
      } catch (error) {
        console.error('Privacy settings listener error:', error)
      }
    })
  }

  private handleSettingsChange(oldSettings: PrivacySettings, newSettings: PrivacySettings): void {
    // Clear cache if caching was disabled
    if (oldSettings.allowCaching && !newSettings.allowCaching) {
      this.clearAllCachedData()
    }

    // Clear share URLs if sharing was disabled
    if (oldSettings.allowSharing && !newSettings.allowSharing) {
      this.clearShareState()
    }

    // Update data retention if changed
    if (oldSettings.dataRetentionDays !== newSettings.dataRetentionDays) {
      this.enforceDataRetention()
    }
  }

  private isLocalhostURL(url: string): boolean {
    try {
      const parsedUrl = new URL(url)
      const hostname = parsedUrl.hostname.toLowerCase()
      return hostname === 'localhost' || 
             hostname === '127.0.0.1' || 
             hostname === '::1' ||
             hostname.endsWith('.local')
    } catch {
      return false
    }
  }

  private async showPermissionDialog(request: NetworkRequest): Promise<boolean> {
    // This would show a custom permission dialog
    // For now, use a simple confirm dialog
    const message = `Allow network request to ${request.type}?\n\nPurpose: ${request.purpose}\nURL: ${request.url}`
    return confirm(message)
  }

  private getBlockedCallsCount(): number {
    // This would track blocked calls in a real implementation
    return 0
  }

  private async clearAllCachedData(): Promise<void> {
    try {
      // Clear IndexedDB cache
      if ('indexedDB' in window) {
        // This would interface with the cache manager
        console.log('Clearing cached analysis data...')
      }
      
      // Clear localStorage analysis cache
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('gutenberg-cache-')) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('Failed to clear cached data:', error)
    }
  }

  private clearShareState(): void {
    // Remove share hash from URL
    if (window.location.hash.includes('#share=')) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }

  private async enforceDataRetention(): Promise<void> {
    const retentionMs = this.settings.dataRetentionDays * 24 * 60 * 60 * 1000
    const cutoffDate = Date.now() - retentionMs

    try {
      // Clear old localStorage entries
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('gutenberg-cache-')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}')
            if (data.timestamp && data.timestamp < cutoffDate) {
              localStorage.removeItem(key)
            }
          } catch {
            // Remove corrupted entries
            localStorage.removeItem(key)
          }
        }
      })

      // This would also clear old IndexedDB entries
      console.log(`Data retention enforced: removed data older than ${this.settings.dataRetentionDays} days`)
    } catch (error) {
      console.error('Failed to enforce data retention:', error)
    }
  }
}

// Global privacy manager instance
export const privacyManager = new PrivacyManager()

/**
 * Hook for network request permission checking
 */
export function useNetworkPermission() {
  return {
    checkPermission: (request: NetworkRequest) => privacyManager.isNetworkRequestAllowed(request),
    requestPermission: (request: NetworkRequest) => privacyManager.requestNetworkPermission(request),
    isLocalOnlyMode: () => privacyManager.getSettings().localOnlyMode
  }
}

/**
 * Wrapper for fetch that respects privacy settings
 */
export async function secureFetch(
  url: string, 
  options: RequestInit = {},
  requestInfo: Omit<NetworkRequest, 'url'> = { type: 'external', purpose: 'Unknown', required: false }
): Promise<Response> {
  const request: NetworkRequest = { ...requestInfo, url }
  
  const allowed = await privacyManager.requestNetworkPermission(request)
  if (!allowed) {
    throw new Error(`Network request blocked by privacy settings: ${request.purpose}`)
  }
  
  return fetch(url, options)
}

/**
 * Privacy-aware localStorage wrapper
 */
export const secureStorage = {
  setItem: (key: string, value: string): void => {
    if (privacyManager.isCachingAllowed()) {
      const timestampedValue = JSON.stringify({
        data: value,
        timestamp: Date.now()
      })
      localStorage.setItem(key, timestampedValue)
    }
  },
  
  getItem: (key: string): string | null => {
    if (!privacyManager.isCachingAllowed()) {
      return null
    }
    
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.data || stored // Fallback for non-timestamped data
      }
    } catch {
      // Return raw value if parsing fails
      return localStorage.getItem(key)
    }
    
    return null
  },
  
  removeItem: (key: string): void => {
    localStorage.removeItem(key)
  },
  
  clear: (): void => {
    // Only clear app-specific data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('gutenberg-')) {
        localStorage.removeItem(key)
      }
    })
  }
}
