import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  WifiOff, 
  Wifi, 
  Download, 
  X, 
  RefreshCw,
  Database,
  AlertTriangle
} from 'lucide-react'
import { usePWA } from '@/lib/pwa/pwa-manager'
import { cacheManager } from '@/lib/cache/cache-manager'

export function OfflineBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)
  const [cacheStats, setCacheStats] = useState<any>(null)
  const { state: pwaState, install, isStandalone } = usePWA()

  // Monitor online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine
      
      if (!isOnline && !wasOffline) {
        // Just went offline
        setIsVisible(true)
        setWasOffline(true)
        loadCacheStats()
      } else if (isOnline && wasOffline) {
        // Just went online
        setWasOffline(false)
        // Keep banner visible for a moment to show "back online"
        setTimeout(() => setIsVisible(false), 3000)
      }
    }

    // Initial check
    updateOnlineStatus()

    // Listen for changes
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [wasOffline])

  const loadCacheStats = async () => {
    try {
      const stats = await cacheManager.getStats()
      setCacheStats(stats)
    } catch (error) {
      console.error('Failed to load cache stats:', error)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  const handleRetry = () => {
    window.location.reload()
  }

  const isOffline = !navigator.onLine

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div className={`
            mx-4 mt-4 rounded-lg border shadow-lg backdrop-blur-sm
            ${isOffline 
              ? 'bg-orange-50/90 border-orange-200 text-orange-900' 
              : 'bg-green-50/90 border-green-200 text-green-900'
            }
          `}>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {isOffline ? (
                  <WifiOff className="h-5 w-5 text-orange-600" />
                ) : (
                  <Wifi className="h-5 w-5 text-green-600" />
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      {isOffline ? 'You\'re offline' : 'Back online!'}
                    </h3>
                    {!isStandalone && !isOffline && (
                      <Badge variant="secondary" className="text-xs">
                        Install for better offline experience
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm opacity-80 mt-1">
                    {isOffline ? (
                      <>
                        You can still view cached analyses and use basic features.
                        {cacheStats && (
                          <span className="ml-1">
                            {cacheStats.booksCount} books cached.
                          </span>
                        )}
                      </>
                    ) : (
                      'Connection restored. All features are now available.'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOffline && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRetry}
                      className="h-8 px-3"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                    
                    {cacheStats && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Show cache info in a toast or modal
                          console.log('Cache stats:', cacheStats)
                        }}
                        className="h-8 px-3"
                      >
                        <Database className="h-3 w-3 mr-1" />
                        Cache ({cacheStats.booksCount})
                      </Button>
                    )}
                  </>
                )}

                {!isStandalone && !isOffline && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={install}
                    className="h-8 px-3"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Install
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Cache Details for Offline */}
            {isOffline && cacheStats && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="border-t border-orange-200 p-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span>
                      <Database className="h-3 w-3 inline mr-1" />
                      {cacheStats.booksCount} books
                    </span>
                    <span>
                      {cacheStats.analysesCount} analyses
                    </span>
                    <span>
                      {(cacheStats.totalSize / 1024 / 1024).toFixed(1)} MB cached
                    </span>
                  </div>
                  
                  <Badge variant="outline" className="text-xs">
                    Offline Mode
                  </Badge>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Simple connection status indicator
export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine)
    
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    
    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  return (
    <div className="fixed bottom-4 right-20 z-40">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: isOnline ? 0 : 1 }}
        className="flex items-center gap-2 bg-orange-100 text-orange-900 px-3 py-2 rounded-full shadow-md text-sm"
      >
        <WifiOff className="h-4 w-4" />
        <span>Offline</span>
      </motion.div>
    </div>
  )
}
