import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { trpc } from '~/lib/trpc'

export const Route = createFileRoute('/onboarding/')({
  component: Onboarding,
})

function Onboarding() {
  const navigate = useNavigate()
  const updateSettings = trpc.settings.update.useMutation()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState({ name: '', level: 'beginner' })
  const [saving, setSaving] = useState(false)

  const steps = [
    {
      title: 'Welcome to YogaFlow',
      description: 'Your personal yoga & calisthenics trainer',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Track workouts, build streaks, and achieve your fitness goals.
          </p>
          <div className="space-y-2">
            <p className="text-sm font-medium">Features:</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✓ Guided workouts with audio cues</li>
              <li>✓ Progress tracking & analytics</li>
              <li>✓ Offline workout support</li>
              <li>✓ Gamification with badges</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'About You',
      description: 'Personalize your experience',
      content: null,
    },
    {
      title: 'All Set!',
      description: "You're ready to start your journey",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Start with a quick warm-up or jump into a full sequence. Your
            progress will be tracked automatically.
          </p>
        </div>
      ),
    },
  ]

  const handleNext = async () => {
    if (step === steps.length - 1) {
      // Save settings before completing onboarding
      setSaving(true)
      updateSettings.mutate({
        userName: profile.name || 'User',
        beepEnabled: true,
        beepStartSeconds: 3,
      }, {
        onSuccess: () => {
          navigate({ to: '/' })
        },
        onError: (error) => {
          console.error('Failed to save settings:', error)
          setSaving(false)
        },
      })
    } else {
      setStep(step + 1)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            {steps[step].title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {steps[step].description}
          </p>
        </div>
        <div className="p-6 pt-0 space-y-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <input
                  id="name"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Your name"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="level" className="text-sm font-medium">
                  Experience Level
                </label>
                <select
                  id="level"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={profile.level}
                  onChange={(e) =>
                    setProfile({ ...profile, level: e.target.value })
                  }
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          ) : (
            steps[step].content
          )}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : step === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
          <div className="flex gap-1 justify-center">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
