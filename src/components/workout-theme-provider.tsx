'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc'

/**
 * Applies workout theme (energy/zen) and contrast mode based on user settings.
 * This component reads from the database and applies data attributes to the html element.
 *
 * - data-workout-theme="energy" | "zen" - Controls primary/accent colors
 * - data-contrast="high" - Enables high contrast mode
 */
export function WorkoutThemeProvider({ children }: { children: React.ReactNode }) {
  const trpc = useTRPC()
  const { data: settings } = useQuery(trpc.settings.get.queryOptions())

  useEffect(() => {
    const html = document.documentElement

    // Apply workout theme
    if (settings?.theme) {
      html.setAttribute('data-workout-theme', settings.theme)
    } else {
      html.removeAttribute('data-workout-theme')
    }

    // Apply contrast mode
    if (settings?.contrastMode) {
      html.setAttribute('data-contrast', 'high')
    } else {
      html.removeAttribute('data-contrast')
    }

    // Cleanup on unmount
    return () => {
      html.removeAttribute('data-workout-theme')
      html.removeAttribute('data-contrast')
    }
  }, [settings?.theme, settings?.contrastMode])

  return <>{children}</>
}
