import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// ============================================================================
// PAGE SKELETONS
// ============================================================================

/**
 * Home page skeleton with stats grid and chart
 */
export function HomePageSkeleton() {
  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  )
}

/**
 * List page skeleton (exercises, sequences)
 */
export function ListPageSkeleton({ itemCount = 6 }: { itemCount?: number }) {
  return (
    <div className="container py-6 space-y-6">
      {/* Header with search */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-64" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* List items */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: itemCount }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

/**
 * Detail page skeleton
 */
export function DetailPageSkeleton() {
  return (
    <div className="container py-6 space-y-6">
      {/* Back button and title */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Media area */}
      <Skeleton className="h-64 w-full rounded-xl" />

      {/* Details sections */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  )
}

/**
 * Form page skeleton
 */
export function FormPageSkeleton() {
  return (
    <div className="container py-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Form fields */}
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <FormFieldSkeleton key={i} />
        ))}
      </div>

      {/* Submit button */}
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

/**
 * Settings page skeleton
 */
export function SettingsPageSkeleton() {
  return (
    <div className="container py-6 space-y-6 max-w-2xl">
      <Skeleton className="h-8 w-32" />

      {/* Settings sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// COMPONENT SKELETONS
// ============================================================================

/**
 * Stats card skeleton
 */
export function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * List item card skeleton
 */
export function ListItemSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Form field skeleton
 */
export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

/**
 * Table row skeleton
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  )
}

/**
 * Avatar skeleton
 */
export function AvatarSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  }
  return <Skeleton className={`${sizeClasses[size]} rounded-full`} />
}

/**
 * Badge skeleton
 */
export function BadgeSkeleton() {
  return <Skeleton className="h-5 w-16 rounded-full" />
}

// ============================================================================
// INLINE LOADING SPINNER
// ============================================================================

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  }

  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-primary border-t-transparent`}
    />
  )
}

/**
 * Centered loading spinner with optional text
 */
export function LoadingState({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <LoadingSpinner size="lg" />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}
