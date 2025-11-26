import { useState, useEffect } from 'react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const DISMISSED_KEY = 'pwa-install-dismissed'

export function PWAInstallPrompt() {
  const { isInstallable, promptInstall } = usePWAInstall()
  const [dismissed, setDismissed] = useState(true) // Start hidden to avoid flash

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const wasDismissed = localStorage.getItem(DISMISSED_KEY)
    setDismissed(!!wasDismissed)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setDismissed(true)
  }

  const handleInstall = async () => {
    const installed = await promptInstall()
    if (installed) {
      setDismissed(true)
    }
  }

  if (!isInstallable || dismissed) {
    return null
  }

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-medium text-sm">Install YogaFlow</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Add to your home screen for the best experience
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleInstall}
            className="h-8 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Install
          </Button>
        </div>
      </div>
    </div>
  )
}
