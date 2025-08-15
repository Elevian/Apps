import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Network, 
  Database, 
  Globe,
  Home,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Clock,
  Users,
  Server
} from 'lucide-react'
import { privacyManager, type PrivacySettings } from '@/lib/security/privacy-manager'
import { networkMonitor } from '@/lib/security/secure-network'

export interface SecurityDashboardProps {
  className?: string
}

export function SecurityDashboard({ className = '' }: SecurityDashboardProps) {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<PrivacySettings>(privacyManager.getSettings())
  const [compliance, setCompliance] = useState(privacyManager.getComplianceSummary())
  const [blockedRequests, setBlockedRequests] = useState(0)
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine)

  // Subscribe to privacy settings changes
  useEffect(() => {
    const unsubscribe = privacyManager.onSettingsChange((newSettings) => {
      setSettings(newSettings)
      setCompliance(privacyManager.getComplianceSummary())
    })
    return unsubscribe
  }, [])

  // Subscribe to network status changes
  useEffect(() => {
    const unsubscribe = networkMonitor.onStatusChange(setNetworkStatus)
    return unsubscribe
  }, [])

  // Update blocked requests count
  useEffect(() => {
    const updateBlockedCount = () => {
      setBlockedRequests(networkMonitor.getBlockedRequestsCount())
    }

    const interval = setInterval(updateBlockedCount, 5000)
    updateBlockedCount()

    return () => clearInterval(interval)
  }, [])

  // Calculate security score
  const securityScore = calculateSecurityScore(settings, compliance)

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy Dashboard
            <SecurityScoreBadge score={securityScore} />
          </CardTitle>
          <CardDescription>
            Real-time overview of your privacy settings and security status
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          
          {/* Security Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SecurityMetric
              icon={settings.localOnlyMode ? Lock : Globe}
              label="Operation Mode"
              value={settings.localOnlyMode ? 'Local Only' : 'Network Enabled'}
              status={settings.localOnlyMode ? 'secure' : 'warning'}
            />

            <SecurityMetric
              icon={Network}
              label="Blocked Requests"
              value={blockedRequests.toString()}
              status={blockedRequests > 0 ? 'info' : 'neutral'}
            />

            <SecurityMetric
              icon={settings.allowAnalytics ? Eye : EyeOff}
              label="Analytics"
              value={settings.allowAnalytics ? 'Enabled' : 'Disabled'}
              status={settings.allowAnalytics ? 'warning' : 'secure'}
            />

            <SecurityMetric
              icon={Activity}
              label="Network Status"
              value={networkStatus ? 'Online' : 'Offline'}
              status={networkStatus ? 'info' : 'warning'}
            />
          </div>

          {/* Privacy Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Privacy Status</h3>
            
            <div className="space-y-3">
              <PrivacyStatusItem
                icon={Globe}
                label="Project Gutenberg API"
                enabled={settings.allowGutenbergAPI}
                description="Download book texts"
              />

              <PrivacyStatusItem
                icon={Home}
                label="Local LLM (Ollama)"
                enabled={settings.allowOllamaLocal}
                description="Character extraction via localhost"
              />

              <PrivacyStatusItem
                icon={Database}
                label="Local Caching"
                enabled={settings.allowCaching}
                description="Store analysis results locally"
              />

              <PrivacyStatusItem
                icon={Network}
                label="Sharing Features"
                enabled={settings.allowSharing}
                description="Generate shareable URLs"
              />

              <PrivacyStatusItem
                icon={Eye}
                label="Usage Analytics"
                enabled={settings.allowAnalytics}
                description="Anonymous usage statistics"
              />
            </div>
          </div>

          {/* Data Management */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Data Management</h3>
            
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Data Retention Period</span>
                </div>
                <Badge variant="outline">
                  {settings.dataRetentionDays} days
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Explicit Consent</span>
                </div>
                <Badge variant={settings.requireExplicitConsent ? 'default' : 'outline'}>
                  {settings.requireExplicitConsent ? 'Required' : 'Optional'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Security Recommendations */}
          <SecurityRecommendations settings={settings} compliance={compliance} />

          {/* Compliance Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Compliance Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ComplianceItem
                label="Local-Only Processing"
                status={compliance.localOnlyMode}
                description="All analysis performed locally"
              />

              <ComplianceItem
                label="Data Retention Policy"
                status={compliance.dataRetentionCompliant}
                description="Automatic data cleanup"
              />

              <ComplianceItem
                label="Privacy by Default"
                status={compliance.analyticsDisabled}
                description="No tracking or analytics"
              />

              <ComplianceItem
                label="User Control"
                status={true}
                description="Granular privacy controls"
              />
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Security metric component
 */
function SecurityMetric({ 
  icon: Icon, 
  label, 
  value, 
  status 
}: { 
  icon: any
  label: string
  value: string
  status: 'secure' | 'warning' | 'info' | 'neutral'
}) {
  const statusColors = {
    secure: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    warning: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800',
    info: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    neutral: 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800'
  }

  return (
    <div className={`p-3 rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}

/**
 * Privacy status item component
 */
function PrivacyStatusItem({ 
  icon: Icon, 
  label, 
  enabled, 
  description 
}: { 
  icon: any
  label: string
  enabled: boolean
  description: string
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {enabled ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
        <Badge variant={enabled ? 'default' : 'secondary'}>
          {enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>
    </div>
  )
}

/**
 * Security recommendations component
 */
function SecurityRecommendations({ 
  settings, 
  compliance 
}: { 
  settings: PrivacySettings
  compliance: any
}) {
  const recommendations = []

  if (!settings.localOnlyMode && settings.allowAnalytics) {
    recommendations.push({
      type: 'warning',
      title: 'Consider disabling analytics',
      description: 'Analytics tracking is enabled. Consider disabling for better privacy.'
    })
  }

  if (settings.dataRetentionDays > 90) {
    recommendations.push({
      type: 'info',
      title: 'Long data retention period',
      description: 'Data is kept for more than 90 days. Consider shorter retention for privacy.'
    })
  }

  if (!settings.requireExplicitConsent && !settings.localOnlyMode) {
    recommendations.push({
      type: 'info',
      title: 'Enable explicit consent',
      description: 'Require permission for each network operation for maximum control.'
    })
  }

  if (recommendations.length === 0) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Excellent!</strong> Your privacy settings follow security best practices.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Security Recommendations</h3>
      {recommendations.map((rec, index) => (
        <Alert key={index}>
          {rec.type === 'warning' ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <AlertDescription>
            <strong>{rec.title}:</strong> {rec.description}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}

/**
 * Compliance item component
 */
function ComplianceItem({ 
  label, 
  status, 
  description 
}: { 
  label: string
  status: boolean
  description: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      {status ? (
        <CheckCircle2 className="h-5 w-5 text-green-600" />
      ) : (
        <XCircle className="h-5 w-5 text-red-600" />
      )}
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

/**
 * Security score badge component
 */
function SecurityScoreBadge({ score }: { score: number }) {
  let variant: 'default' | 'secondary' | 'destructive' = 'secondary'
  let label = 'Basic'

  if (score >= 90) {
    variant = 'default'
    label = 'Excellent'
  } else if (score >= 70) {
    variant = 'secondary'
    label = 'Good'
  } else if (score >= 50) {
    variant = 'secondary'
    label = 'Fair'
  } else {
    variant = 'destructive'
    label = 'Needs Improvement'
  }

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Shield className="h-3 w-3" />
      {label} ({score}%)
    </Badge>
  )
}

/**
 * Calculate security score based on settings
 */
function calculateSecurityScore(settings: PrivacySettings, compliance: any): number {
  let score = 0

  // Local-only mode gets highest score
  if (settings.localOnlyMode) score += 40

  // Analytics disabled
  if (!settings.allowAnalytics) score += 20

  // Caching policy
  if (settings.allowCaching) score += 10
  
  // Data retention
  if (settings.dataRetentionDays <= 30) score += 15
  else if (settings.dataRetentionDays <= 90) score += 10
  else if (settings.dataRetentionDays <= 365) score += 5

  // Explicit consent
  if (settings.requireExplicitConsent) score += 10

  // Network restrictions
  if (!settings.allowGutenbergAPI && settings.localOnlyMode) score += 5

  return Math.min(100, score)
}
