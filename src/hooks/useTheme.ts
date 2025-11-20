import { useEffect } from 'react'
import { useTRPC } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'

export function useTheme() {
  const trpc = useTRPC()
  const { data: settings } = useQuery(trpc.settings.get.queryOptions())
  const theme = settings?.theme || 'energy'

  useEffect(() => {
    // Apply theme to HTML element
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
  }, [theme])

  return theme
}
