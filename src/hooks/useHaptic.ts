import { useTRPC } from '@/lib/trpc'

export function useHaptic() {
  const { data: settings } = useTRPC.settings.get.useQuery()
  const hapticEnabled = settings?.hapticEnabled ?? true

  const vibrate = (pattern: number | number[]) => {
    if (!hapticEnabled) return

    // Check if the Vibration API is available
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  return {
    // Light tap (button press, UI interaction)
    light: () => vibrate(10),

    // Medium tap (exercise transition, notification)
    medium: () => vibrate(20),

    // Strong tap (workout complete, achievement)
    strong: () => vibrate(50),

    // Success pattern (completion, milestone)
    success: () => vibrate([50, 100, 50]),

    // Alert pattern (warning, error)
    alert: () => vibrate([100, 50, 100]),
  }
}
