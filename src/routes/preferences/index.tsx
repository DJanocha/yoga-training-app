import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { Download, Check } from 'lucide-react'
import { useTRPC } from '@/lib/trpc'
import { RedirectToSignIn, SignedIn, AuthLoading } from '@/components/auth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ThemeSelector } from '@/components/theme-toggle'
import { ButtonGroup } from '@/components/ui/button-group'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/preferences/')({
  component: Preferences,
})

function Preferences() {
  return (
    <>
      <AuthLoading>
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AuthLoading>
      <RedirectToSignIn />
      <SignedIn>
        <PreferencesContent />
      </SignedIn>
    </>
  )
}

function PreferencesContent() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery(trpc.settings.get.queryOptions())
  const updateSettings = useMutation(trpc.settings.update.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.settings.get.queryKey() })
    },
  }))
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall()

  const [beepEnabled, setBeepEnabled] = useState(
    settings?.beepEnabled ?? true,
  )
  const [beepStartSeconds, setBeepStartSeconds] = useState(
    settings?.beepStartSeconds || 3,
  )
  const [workoutTheme, setWorkoutTheme] = useState<'default' | 'energy' | 'zen'>(
    (settings?.theme as 'energy' | 'zen') || 'default',
  )
  const [hapticEnabled, setHapticEnabled] = useState(
    settings?.hapticEnabled ?? true,
  )
  const [contrastMode, setContrastMode] = useState(
    settings?.contrastMode ?? false,
  )
  const [weeklyGoal, setWeeklyGoal] = useState(
    settings?.weeklyGoal || 3,
  )

  const [activeTab, setActiveTab] = useState<
    'audio' | 'display' | 'goals' | 'data'
  >('audio')

  // Apply workout theme and contrast mode immediately for preview
  useEffect(() => {
    const html = document.documentElement

    // Apply workout theme
    if (workoutTheme && workoutTheme !== 'default') {
      html.setAttribute('data-workout-theme', workoutTheme)
    } else {
      html.removeAttribute('data-workout-theme')
    }

    // Apply contrast mode
    if (contrastMode) {
      html.setAttribute('data-contrast', 'high')
    } else {
      html.removeAttribute('data-contrast')
    }
  }, [workoutTheme, contrastMode])

  const handleSave = async () => {
    updateSettings.mutate({
      beepEnabled,
      beepStartSeconds,
      theme: workoutTheme === 'default' ? undefined : workoutTheme,
      hapticEnabled,
      contrastMode,
      weeklyGoal,
    })
  }

  if (isLoading || !settings) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Preferences</h1>
        <p className="text-muted-foreground">Customize your workout experience</p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="grid grid-cols-4 border-b">
          {(['audio', 'display', 'goals', 'data'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6">

          {activeTab === 'audio' && (
            <section className="space-y-4">
              <header>
                <h2 className="text-lg font-semibold">Audio</h2>
                <p className="text-sm text-muted-foreground">
                  Control workout sounds and cues.
                </p>
              </header>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={beepEnabled}
                  onChange={(e) => setBeepEnabled(e.target.checked)}
                />
                Play interval beeps
              </label>
              <div className="space-y-2">
                <label htmlFor="beepSeconds" className="text-sm font-medium">
                  Beep starts (seconds before end)
                </label>
                <input
                  id="beepSeconds"
                  type="number"
                  min={1}
                  max={10}
                  value={beepStartSeconds}
                  onChange={(e) =>
                    setBeepStartSeconds(Number.parseInt(e.target.value, 10) || 3)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </section>
          )}

          {activeTab === 'display' && (
            <section className="space-y-4">
              <header>
                <h2 className="text-lg font-semibold">Display</h2>
                <p className="text-sm text-muted-foreground">
                  Adjust accessibility and visual preferences.
                </p>
              </header>

              {/* Dark/Light Mode Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Appearance</label>
                <p className="text-sm text-muted-foreground">
                  Choose light or dark mode for the app.
                </p>
                <ThemeSelector />
              </div>

              {/* Workout Theme Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Workout Theme</label>
                <p className="text-sm text-muted-foreground">
                  Choose the color style for buttons and accents.
                </p>
                <ButtonGroup className="w-full">
                  <Button
                    type="button"
                    variant={workoutTheme === 'default' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setWorkoutTheme('default')}
                  >
                    Default
                  </Button>
                  <Button
                    type="button"
                    variant={workoutTheme === 'energy' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setWorkoutTheme('energy')}
                  >
                    Energy
                  </Button>
                  <Button
                    type="button"
                    variant={workoutTheme === 'zen' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setWorkoutTheme('zen')}
                  >
                    Zen
                  </Button>
                </ButtonGroup>
                <p className="text-xs text-muted-foreground">
                  {workoutTheme === 'default' && 'Standard black/white theme'}
                  {workoutTheme === 'energy' && 'Vibrant orange for high-intensity motivation'}
                  {workoutTheme === 'zen' && 'Calm sage green for mindful practice'}
                </p>
              </div>

              {/* Haptic Feedback */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={hapticEnabled}
                    onChange={(e) => setHapticEnabled(e.target.checked)}
                  />
                  Enable haptic feedback
                </label>
                <p className="text-sm text-muted-foreground">
                  Vibrate on exercise transitions (mobile devices only).
                </p>
              </div>

              {/* Contrast Mode */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={contrastMode}
                    onChange={(e) => setContrastMode(e.target.checked)}
                  />
                  High contrast mode
                </label>
                <p className="text-sm text-muted-foreground">
                  Increase text contrast for better readability.
                </p>
              </div>

              {/* PWA Install */}
              <div className="space-y-2 pt-4 border-t">
                <h3 className="text-sm font-medium">Install App</h3>
                <p className="text-sm text-muted-foreground">
                  Install YogaFlow on your device for a better experience.
                </p>
                {isInstalled ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    <span>App is installed</span>
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={promptInstall}
                    aria-label="Install YogaFlow app on this device"
                    className="inline-flex items-center gap-2 justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    Install App
                  </button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    App is already installed or not installable on this device.
                  </p>
                )}
              </div>
            </section>
          )}

          {activeTab === 'goals' && (
            <section className="space-y-4">
              <header>
                <h2 className="text-lg font-semibold">Goals</h2>
                <p className="text-sm text-muted-foreground">
                  Set weekly targets to stay consistent.
                </p>
              </header>
              <div className="space-y-2">
                <label htmlFor="weeklyGoal" className="text-sm font-medium">
                  Weekly workout goal
                </label>
                <p className="text-sm text-muted-foreground">
                  How many workouts do you want to complete each week?
                </p>
                <input
                  id="weeklyGoal"
                  type="number"
                  min={1}
                  max={14}
                  value={weeklyGoal}
                  onChange={(e) =>
                    setWeeklyGoal(Number.parseInt(e.target.value, 10) || 3)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 3-5 workouts per week for steady progress
                </p>
              </div>
            </section>
          )}

          {activeTab === 'data' && (
            <section className="space-y-4">
              <header>
                <h2 className="text-lg font-semibold">Data Management</h2>
                <p className="text-sm text-muted-foreground">
                  Export your workout data for backup or analysis.
                </p>
              </header>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Export Workout Data</h3>
                <p className="text-sm text-muted-foreground">
                  Download all your workout history, sequences, and exercises as JSON.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const data = await queryClient.fetchQuery(trpc.executions.exportData.queryOptions())
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `yogaflow-data-${new Date().toISOString().split('T')[0]}.json`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    } catch (error) {
                      console.error('Export failed:', error)
                    }
                  }}
                  className="inline-flex items-center gap-2 justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <Download className="h-4 w-4" />
                  Export Data
                </button>
              </div>
            </section>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              onClick={handleSave}
              aria-label="Save all preferences"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
