import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Scale, 
  BookOpen, 
  ExternalLink, 
  Info, 
  AlertTriangle,
  CheckCircle2,
  Globe,
  Shield,
  Copyright,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export interface LegalDisclaimerProps {
  className?: string
  variant?: 'full' | 'compact' | 'banner'
  onAccept?: () => void
  showAcceptButton?: boolean
}

export function LegalDisclaimer({
  className = '',
  variant = 'full',
  onAccept,
  showAcceptButton = false
}: LegalDisclaimerProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(variant === 'full')

  if (variant === 'banner') {
    return <LegalBanner className={className} onAccept={onAccept} />
  }

  if (variant === 'compact') {
    return <CompactLegalInfo className={className} />
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Legal Information & Disclaimers
            <Badge variant="outline" className="text-xs">
              <Globe className="h-3 w-3 mr-1" />
              Public Domain
            </Badge>
          </CardTitle>
          <CardDescription>
            Important information about Project Gutenberg content, licensing, and usage rights
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          
          {/* Project Gutenberg Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Project Gutenberg Content
            </h3>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Public Domain Works:</strong> All books analyzed through this application are sourced from 
                Project Gutenberg, which provides access to literature that is in the public domain in the United States.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">What This Means:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• These works are <strong>free to use, share, and analyze</strong></li>
                  <li>• No permission is required for academic or commercial use</li>
                  <li>• Copyright has expired or been explicitly released</li>
                  <li>• Works are available worldwide through Project Gutenberg</li>
                </ul>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-200">Attribution Guidelines:</h4>
                <p className="text-blue-800 dark:text-blue-300 text-sm">
                  While not legally required, we encourage citing both the original author and 
                  Project Gutenberg when using these texts in academic or professional work.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Copyright and Licensing */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Copyright className="h-4 w-4" />
              Copyright & Licensing
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Source Material</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>Public domain in the USA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>Free to redistribute</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>No usage restrictions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>Commercial use allowed</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Analysis Results</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Info className="h-3 w-3 text-blue-600" />
                    <span>Generated by this application</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-3 w-3 text-blue-600" />
                    <span>Available under MIT License</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-3 w-3 text-blue-600" />
                    <span>Free to use and share</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-3 w-3 text-blue-600" />
                    <span>Attribution appreciated</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* International Considerations */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              International Considerations
            </h3>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> While these works are in the public domain in the United States, 
                copyright laws vary by country. Some works may still be under copyright in your jurisdiction.
              </AlertDescription>
            </Alert>

            <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <h4 className="font-medium mb-2 text-amber-900 dark:text-amber-200">Before Commercial Use:</h4>
              <ul className="space-y-1 text-amber-800 dark:text-amber-300 text-sm">
                <li>• Check copyright status in your country</li>
                <li>• Verify public domain status for your use case</li>
                <li>• Consider consulting legal counsel for commercial projects</li>
                <li>• Respect any additional restrictions in your jurisdiction</li>
              </ul>
            </div>
          </div>

          <Separator />

          {/* Application Disclaimers */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Application Disclaimers
            </h3>

            <div className="space-y-3 text-sm">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-1">Analysis Accuracy</h4>
                <p className="text-muted-foreground">
                  Character analysis and sentiment detection are automated processes that may contain errors. 
                  Results should be verified for academic or professional use.
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-1">Data Processing</h4>
                <p className="text-muted-foreground">
                  This application processes text locally in your browser. No content is sent to external 
                  servers unless explicitly enabled in privacy settings.
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-1">Third-Party Services</h4>
                <p className="text-muted-foreground">
                  Optional features may use external services (like local LLM instances). 
                  Review privacy settings to control data sharing.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Useful Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Useful Resources</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Project Gutenberg</h4>
                <div className="space-y-1">
                  <a 
                    href="https://www.gutenberg.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Project Gutenberg Homepage
                  </a>
                  <a 
                    href="https://www.gutenberg.org/policy/permission.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Permission & Copyright
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Copyright Information</h4>
                <div className="space-y-1">
                  <a 
                    href="https://copyright.gov/help/faq/faq-duration.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <ExternalLink className="h-3 w-3" />
                    US Copyright Duration
                  </a>
                  <a 
                    href="https://publicdomain.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Public Domain Information
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Accept Button */}
          {showAcceptButton && (
            <>
              <Separator />
              <div className="flex justify-center">
                <Button onClick={onAccept} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  I Understand and Accept
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Compact legal information component
 */
function CompactLegalInfo({ className = '' }: { className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={className}>
      <div className="border rounded-lg p-4">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Legal Information</span>
            <Badge variant="outline" className="text-xs">
              Public Domain
            </Badge>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3 text-sm text-muted-foreground"
            >
              <p>
                All books are sourced from Project Gutenberg and are in the public domain in the USA. 
                Analysis results are generated locally and are free to use and share.
              </p>
              <div className="flex flex-wrap gap-2">
                <a 
                  href="https://www.gutenberg.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <ExternalLink className="h-3 w-3" />
                  Project Gutenberg
                </a>
                <span>•</span>
                <a 
                  href="https://www.gutenberg.org/policy/permission.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <ExternalLink className="h-3 w-3" />
                  Copyright Policy
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/**
 * Legal banner for first-time users
 */
function LegalBanner({ 
  className = '', 
  onAccept 
}: { 
  className?: string
  onAccept?: () => void 
}) {
  const [isVisible, setIsVisible] = useState(true)

  const handleAccept = () => {
    setIsVisible(false)
    onAccept?.()
  }

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-1">
            Public Domain Content Notice
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
            This application analyzes books from Project Gutenberg, which are in the public domain 
            in the United States. Analysis is performed locally in your browser for privacy.
          </p>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={handleAccept}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Understood
            </Button>
            <a 
              href="https://www.gutenberg.org/policy/permission.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Hook for managing legal disclaimer acceptance
 */
export function useLegalDisclaimer() {
  const [hasAccepted, setHasAccepted] = useState(() => {
    try {
      return localStorage.getItem('gutenberg-legal-accepted') === 'true'
    } catch {
      return false
    }
  })

  const acceptDisclaimer = () => {
    try {
      localStorage.setItem('gutenberg-legal-accepted', 'true')
      localStorage.setItem('gutenberg-legal-accepted-date', new Date().toISOString())
      setHasAccepted(true)
    } catch (error) {
      console.warn('Failed to save legal acceptance:', error)
    }
  }

  const resetAcceptance = () => {
    try {
      localStorage.removeItem('gutenberg-legal-accepted')
      localStorage.removeItem('gutenberg-legal-accepted-date')
      setHasAccepted(false)
    } catch (error) {
      console.warn('Failed to reset legal acceptance:', error)
    }
  }

  return {
    hasAccepted,
    acceptDisclaimer,
    resetAcceptance,
    shouldShowDisclaimer: !hasAccepted
  }
}
