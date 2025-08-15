import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Network, 
  Database, 
  Share2, 
  Download, 
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Globe,
  Home,
  Server,
  Clock
} from 'lucide-react'
import { privacyManager, type PrivacySettings } from '@/lib/security/privacy-manager'
import { toast } from 'sonner'

export interface PrivacySettingsPanelProps {
  className?: string
  onSettingsChange?: (settings: PrivacySettings) => void
}

export function PrivacySettingsPanel({
  className = '',
  onSettingsChange
}: PrivacySettingsPanelProps) {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<PrivacySettings>(privacyManager.getSettings())
  const [compliance, setCompliance] = useState(privacyManager.getComplianceSummary())
  const [isImporting, setIsImporting] = useState(false)

  // Subscribe to settings changes
  useEffect(() => {
    const unsubscribe = privacyManager.onSettingsChange((newSettings) => {
      setSettings(newSettings)
      setCompliance(privacyManager.getComplianceSummary())
      onSettingsChange?.(newSettings)
    })
    return unsubscribe
  }, [onSettingsChange])

  /**
   * Update a single setting
   */
  const updateSetting = <K extends keyof PrivacySettings>(
    key: K, 
    value: PrivacySettings[K]
  ) => {
    privacyManager.updateSettings({ [key]: value })
    toast.success('Privacy setting updated')
  }

  /**
   * Toggle local-only mode with confirmation
   */
  const toggleLocalOnlyMode = () => {
    if (!settings.localOnlyMode) {
      // Warn user about disabling features
      const confirmed = confirm(
        'Local-only mode will disable external network calls, sharing features, and analytics. Continue?'
      )
      if (!confirmed) return
    }
    
    updateSetting('localOnlyMode', !settings.localOnlyMode)
    
    if (!settings.localOnlyMode) {
      toast.info('Local-only mode enabled. External features disabled.')
    } else {
      toast.success('Local-only mode disabled. All features available.')
    }
  }

  /**
   * Reset to default settings
   */
  const resetToDefaults = () => {
    const confirmed = confirm('Reset all privacy settings to defaults? This cannot be undone.')
    if (confirmed) {
      privacyManager.resetToDefaults()
      toast.success('Privacy settings reset to defaults')
    }
  }

  /**
   * Export settings
   */
  const exportSettings = () => {
    try {
      const settingsJson = privacyManager.exportSettings()
      const blob = new Blob([settingsJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `gutenberg-privacy-settings-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Privacy settings exported')
    } catch (error) {
      toast.error('Failed to export settings')
    }
  }

  /**
   * Import settings
   */
  const importSettings = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setIsImporting(true)
      try {
        const text = await file.text()
        const success = privacyManager.importSettings(text)
        if (success) {
          toast.success('Privacy settings imported successfully')
        } else {
          toast.error('Invalid settings file format')
        }
      } catch (error) {
        toast.error('Failed to import settings')
      } finally {
        setIsImporting(false)
      }
    }
    input.click()
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security Settings
            {settings.localOnlyMode && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <Lock className="h-3 w-3 mr-1" />
                Local Only
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Control how the application handles your data and network connections
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          
          {/* Privacy Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {compliance.localOnlyMode ? (
                  <Lock className="h-5 w-5 text-green-600" />
                ) : (
                  <Globe className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <p className="text-sm font-medium">
                {compliance.localOnlyMode ? 'Local Only' : 'Network Enabled'}
              </p>
            </div>

            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Network className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-sm font-medium">
                {compliance.externalCallsBlocked} Blocked
              </p>
            </div>

            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Database className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-sm font-medium">
                {settings.dataRetentionDays}d Retention
              </p>
            </div>

            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {compliance.analyticsDisabled ? (
                  <EyeOff className="h-5 w-5 text-green-600" />
                ) : (
                  <Eye className="h-5 w-5 text-red-600" />
                )}
              </div>
              <p className="text-sm font-medium">
                {compliance.analyticsDisabled ? 'Private' : 'Tracked'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Local-Only Mode */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <Label htmlFor="local-only" className="font-medium">
                    Local-Only Mode
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Disable all external network calls except essential Project Gutenberg API
                </p>
              </div>
              <Switch
                id="local-only"
                checked={settings.localOnlyMode}
                onCheckedChange={toggleLocalOnlyMode}
              />
            </div>

            {settings.localOnlyMode && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Local-only mode is active. Sharing, analytics, and external LLM features are disabled.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Network Permissions */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Network Permissions</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <Label className="text-sm">Project Gutenberg API</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Download book texts from gutenberg.org
                  </p>
                </div>
                <Switch
                  checked={settings.allowGutenbergAPI}
                  onCheckedChange={(checked) => updateSetting('allowGutenbergAPI', checked)}
                  disabled={settings.localOnlyMode}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <Label className="text-sm">Local LLM (Ollama)</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Connect to localhost Ollama for character extraction
                  </p>
                </div>
                <Switch
                  checked={settings.allowOllamaLocal}
                  onCheckedChange={(checked) => updateSetting('allowOllamaLocal', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    <Label className="text-sm">Sharing Features</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enable URL sharing and state synchronization
                  </p>
                </div>
                <Switch
                  checked={settings.allowSharing}
                  onCheckedChange={(checked) => updateSetting('allowSharing', checked)}
                  disabled={settings.localOnlyMode}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <Label className="text-sm">Usage Analytics</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Anonymous usage statistics (currently disabled)
                  </p>
                </div>
                <Switch
                  checked={settings.allowAnalytics}
                  onCheckedChange={(checked) => updateSetting('allowAnalytics', checked)}
                  disabled={settings.localOnlyMode}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Data Management */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Data Management</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <Label className="text-sm">Local Caching</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cache analysis results in browser storage
                  </p>
                </div>
                <Switch
                  checked={settings.allowCaching}
                  onCheckedChange={(checked) => updateSetting('allowCaching', checked)}
                  disabled={settings.localOnlyMode}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <Label className="text-sm">Data Retention</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Automatically delete cached data after specified days
                  </p>
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={settings.dataRetentionDays}
                    onChange={(e) => updateSetting('dataRetentionDays', parseInt(e.target.value) || 30)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <Label className="text-sm">Explicit Consent</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ask permission for each network operation
                  </p>
                </div>
                <Switch
                  checked={settings.requireExplicitConsent}
                  onCheckedChange={(checked) => updateSetting('requireExplicitConsent', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Settings Management */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Settings Management</h3>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportSettings}
                className="flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                Export Settings
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={importSettings}
                disabled={isImporting}
                className="flex items-center gap-2"
              >
                <Upload className="h-3 w-3" />
                Import Settings
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaults}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Defaults
              </Button>
            </div>
          </div>

          {/* Privacy Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Privacy Commitment:</strong> This application processes all data locally in your browser. 
              No analysis data is sent to external servers unless explicitly enabled. 
              Your privacy is our priority.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Compact privacy status indicator
 */
export function PrivacyStatusIndicator({ className = '' }: { className?: string }) {
  const [settings, setSettings] = useState<PrivacySettings>(privacyManager.getSettings())

  useEffect(() => {
    const unsubscribe = privacyManager.onSettingsChange(setSettings)
    return unsubscribe
  }, [])

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {settings.localOnlyMode ? (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <Lock className="h-3 w-3 mr-1" />
          Local Only
        </Badge>
      ) : (
        <Badge variant="outline">
          <Globe className="h-3 w-3 mr-1" />
          Network Enabled
        </Badge>
      )}
    </div>
  )
}

/**
 * Privacy-aware network request component
 */
export function NetworkRequestGuard({ 
  children, 
  requestType, 
  fallback 
}: { 
  children: React.ReactNode
  requestType: 'gutenberg' | 'ollama' | 'sharing' | 'analytics'
  fallback?: React.ReactNode 
}) {
  const [settings, setSettings] = useState<PrivacySettings>(privacyManager.getSettings())

  useEffect(() => {
    const unsubscribe = privacyManager.onSettingsChange(setSettings)
    return unsubscribe
  }, [])

  let isAllowed = false
  switch (requestType) {
    case 'gutenberg':
      isAllowed = settings.allowGutenbergAPI
      break
    case 'ollama':
      isAllowed = settings.allowOllamaLocal
      break
    case 'sharing':
      isAllowed = settings.allowSharing && !settings.localOnlyMode
      break
    case 'analytics':
      isAllowed = settings.allowAnalytics && !settings.localOnlyMode
      break
  }

  if (isAllowed) {
    return <>{children}</>
  }

  return (
    <>
      {fallback || (
        <div className="text-center p-4 text-muted-foreground">
          <Shield className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Feature disabled by privacy settings</p>
        </div>
      )}
    </>
  )
}
