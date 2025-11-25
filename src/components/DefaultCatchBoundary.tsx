import { AlertTriangle, RefreshCw, Home, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Link, useRouter } from '@tanstack/react-router'

type ErrorBoundaryProps = {
  error: Error
  reset?: () => void
}

export function DefaultCatchBoundary({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter()
  const [showDetails, setShowDetails] = useState(false)

  const handleRetry = () => {
    if (reset) {
      reset()
    } else {
      router.invalidate()
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            We encountered an unexpected error. Please try again or return to the home page.
          </p>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex w-full items-center justify-between rounded-lg border p-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <span>Technical details</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            />
          </button>

          {showDetails && (
            <pre className="max-h-32 overflow-auto rounded-lg bg-muted p-3 text-xs">
              {error?.message || 'Unknown error'}
              {error?.stack && (
                <>
                  {'\n\n'}
                  {error.stack}
                </>
              )}
            </pre>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" className="flex-1" asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button className="flex-1" onClick={handleRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Simplified error component for inline use
export function InlineError({
  message = 'Failed to load',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-3 w-3" />
          Retry
        </Button>
      )}
    </div>
  )
}
