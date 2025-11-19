import { useEffect } from 'react'
import { trpc } from '~/lib/trpc'

export function useTheme() {
  const { data: settings } = trpc.settings.get.useQuery()
  const theme = settings?.theme || 'energy'

  useEffect(() => {
    // Apply theme to HTML element
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
  }, [theme])

  return theme
}
