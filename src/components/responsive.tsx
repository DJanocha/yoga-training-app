'use client'

import type { ReactNode } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'

// ============================================================================
// BREAKPOINT CONSTANTS
// ============================================================================

/**
 * Tailwind CSS default breakpoints (for reference)
 * sm: 640px
 * md: 768px (tablet portrait)
 * lg: 1024px (tablet landscape / small desktop)
 * xl: 1280px (desktop)
 * 2xl: 1536px (large desktop)
 */

// ============================================================================
// RESPONSIVE COMPONENTS
// ============================================================================

/**
 * Show content only on mobile (< md breakpoint)
 */
export function MobileOnly({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile()
  if (!isMobile) return null
  return <>{children}</>
}

/**
 * Show content only on desktop (>= md breakpoint)
 */
export function DesktopOnly({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile()
  if (isMobile) return null
  return <>{children}</>
}

/**
 * Responsive container with proper max-widths
 */
export function ResponsiveContainer({
  children,
  className = '',
  size = 'default',
}: {
  children: ReactNode
  className?: string
  size?: 'narrow' | 'default' | 'wide' | 'full'
}) {
  const sizeClasses = {
    narrow: 'max-w-md',
    default: 'max-w-2xl',
    wide: 'max-w-4xl',
    full: 'max-w-7xl',
  }

  return (
    <div className={`mx-auto w-full px-4 md:px-6 lg:px-8 ${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Responsive grid that adjusts columns based on screen size
 */
export function ResponsiveGrid({
  children,
  className = '',
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 4,
}: {
  children: ReactNode
  className?: string
  cols?: { sm?: number; md?: number; lg?: number; xl?: number }
  gap?: number | { x?: number; y?: number }
}) {
  const gapClass = typeof gap === 'number'
    ? `gap-${gap}`
    : `gap-x-${gap.x ?? 4} gap-y-${gap.y ?? 4}`

  // Build grid classes dynamically
  const colClasses = [
    cols.sm && `grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ')

  return (
    <div className={`grid ${colClasses} ${gapClass} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Stack that switches between vertical (mobile) and horizontal (desktop)
 */
export function ResponsiveStack({
  children,
  className = '',
  gap = 4,
  breakAt = 'md',
}: {
  children: ReactNode
  className?: string
  gap?: number
  breakAt?: 'sm' | 'md' | 'lg'
}) {
  const directionClass = {
    sm: `flex-col sm:flex-row`,
    md: `flex-col md:flex-row`,
    lg: `flex-col lg:flex-row`,
  }

  return (
    <div className={`flex ${directionClass[breakAt]} gap-${gap} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Content that fills available height on mobile
 */
export function MobileFullHeight({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`min-h-[calc(100dvh-theme(spacing.14)-theme(spacing.16))] md:min-h-0 ${className}`}>
      {children}
    </div>
  )
}

// ============================================================================
// RESPONSIVE SPACING UTILITIES
// ============================================================================

/**
 * Page wrapper with consistent padding that accounts for mobile nav
 */
export function PageWrapper({
  children,
  className = '',
  noPadding = false,
}: {
  children: ReactNode
  className?: string
  noPadding?: boolean
}) {
  return (
    <div
      className={`
        ${noPadding ? '' : 'p-4 md:p-6 lg:p-8'}
        pb-20 md:pb-6 lg:pb-8
        ${className}
      `}
    >
      {children}
    </div>
  )
}

/**
 * Page header with responsive sizing
 */
export function PageHeader({
  title,
  subtitle,
  action,
  className = '',
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 md:flex-row md:items-center md:justify-between md:gap-4 ${className}`}>
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground md:text-base">{subtitle}</p>
        )}
      </div>
      {action && <div className="mt-2 md:mt-0">{action}</div>}
    </div>
  )
}

// ============================================================================
// RESPONSIVE TEXT UTILITIES
// ============================================================================

/**
 * Text that scales with viewport
 */
export function ResponsiveText({
  children,
  as: Component = 'p',
  size = 'default',
  className = '',
}: {
  children: ReactNode
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl'
  className?: string
}) {
  const sizeClasses = {
    xs: 'text-xs md:text-sm',
    sm: 'text-sm md:text-base',
    default: 'text-base md:text-lg',
    lg: 'text-lg md:text-xl',
    xl: 'text-xl md:text-2xl lg:text-3xl',
  }

  return (
    <Component className={`${sizeClasses[size]} ${className}`}>
      {children}
    </Component>
  )
}
