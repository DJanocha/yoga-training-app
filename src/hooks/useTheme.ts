import { useEffect } from 'react'
import { useTRPC } from '@/lib/trpc'

export function useTheme() {
  const { data: settings } = useTRPC.settings.get.useQuery()
  const theme = settings?.theme || 'energy'

  useEffect(() => {
    // Apply theme to HTML element
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
  }, [theme])

  return theme
}
