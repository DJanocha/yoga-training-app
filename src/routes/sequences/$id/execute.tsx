import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTRPC } from '@/lib/trpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RedirectToSignIn, SignedIn, AuthLoading } from '@/components/auth'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  CheckCircle,
  Coffee,
  Clock,
  Repeat,
  Star,
  Plus,
  Minus,
  Check,
  Package2,
} from 'lucide-react'
import type { SequenceExercise, CompletedExercise, ActiveModifier } from '@/db/types'

export const Route = createFileRoute('/sequences/$id/execute')({
  component: ExecuteSequence,
})

function ExecuteSequence() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const sequenceId = parseInt(id, 10)

  if (isNaN(sequenceId)) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Invalid sequence ID</p>
        <Button
          onClick={() => navigate({ to: '/sequences' })}
          className="mt-4"
        >
          Back to Sequences
        </Button>
      </div>
    )
  }

  return (
    <>
      <AuthLoading>
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthLoading>
      <RedirectToSignIn />
      <SignedIn>
        <ExecuteSequenceContent sequenceId={sequenceId} />
      </SignedIn>
    </>
  )
}

function ExecuteSequenceContent({ sequenceId }: { sequenceId: number }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Fetch sequence
  const { data: sequence, isLoading: sequenceLoading } = useQuery(
    trpc.sequences.byId.queryOptions({ id: sequenceId })
  )

  // Fetch all exercises for names
  const { data: allExercises } = useQuery(trpc.exercises.list.queryOptions())

  // Fetch user settings for beep/haptic preferences
  const { data: userSettings } = useQuery(trpc.settings.get.queryOptions())

  // Fetch modifiers
  const { data: allModifiers } = useQuery(trpc.modifiers.list.queryOptions())

  // Mutations
  const startExecution = useMutation(trpc.executions.start.mutationOptions())
  const updateExecution = useMutation(trpc.executions.updateExecution.mutationOptions())
  const submitRating = useMutation(
    trpc.executions.submitRating.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.executions.getUserStats.queryKey() })
      },
    })
  )

  // Execution state
  const [executionId, setExecutionId] = useState<number | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([])
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [actualValue, setActualValue] = useState<number>(0)

  // Rating state
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')

  // Active modifiers state (per-exercise during execution)
  const [activeModifiers, setActiveModifiers] = useState<ActiveModifier[]>([])

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const exerciseStartRef = useRef<Date>(new Date())
  const hasStartedRef = useRef(false)

  // Get exercises from sequence
  const exercises = sequence?.exercises as SequenceExercise[] | undefined

  // Get exercise name
  const getExerciseName = useCallback((exerciseId: number | 'break'): string => {
    if (exerciseId === 'break') return 'Break'
    return allExercises?.find((ex) => ex.id === exerciseId)?.name || `Exercise #${exerciseId}`
  }, [allExercises])

  // Audio beep function
  const playBeep = useCallback((frequency: number = 800, duration: number = 200) => {
    if (!userSettings?.beepEnabled) return

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration / 1000)
    } catch (error) {
      console.error('Audio beep failed:', error)
    }
  }, [userSettings?.beepEnabled])

  // Haptic feedback function
  const triggerHaptic = useCallback((pattern: number | number[] = 200) => {
    if (!userSettings?.hapticEnabled) return

    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern)
      }
    } catch (error) {
      console.error('Haptic feedback failed:', error)
    }
  }, [userSettings?.hapticEnabled])

  // Start execution on mount
  useEffect(() => {
    if (sequence && !executionId && !hasStartedRef.current) {
      hasStartedRef.current = true
      startExecution.mutate(
        { sequenceId },
        {
          onSuccess: (data) => {
            if (data) {
              setExecutionId(data.id)
              exerciseStartRef.current = new Date()
            }
          },
        }
      )
    }
  }, [sequence, executionId, sequenceId])

  // Initialize actualValue and active modifiers when exercise changes
  useEffect(() => {
    if (exercises && currentIndex < exercises.length) {
      const currentExercise = exercises[currentIndex]
      setActualValue(currentExercise.config.targetValue || 0)

      // Initialize active modifiers from the exercise's assigned modifiers
      // Pre-select all assigned modifiers with their values
      if (currentExercise.modifiers && currentExercise.modifiers.length > 0) {
        const initialActiveModifiers: ActiveModifier[] = currentExercise.modifiers.map((m) => {
          const modifier = allModifiers?.find((mod) => mod.id === m.modifierId)
          return {
            modifierId: m.modifierId,
            value: modifier?.value !== null && modifier?.value !== undefined
              ? `${modifier.value}${modifier.unit && modifier.unit !== 'none' && modifier.unit !== 'level' ? modifier.unit : ''}`
              : undefined,
          }
        })
        setActiveModifiers(initialActiveModifiers)
      } else {
        setActiveModifiers([])
      }
    }
  }, [currentIndex, exercises, allModifiers])

  // Timer effect
  useEffect(() => {
    if (!isPaused && !isCompleted && exercises && currentIndex < exercises.length) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPaused, isCompleted, exercises, currentIndex])

  // Beep countdown effect for time-based exercises
  useEffect(() => {
    if (!exercises || currentIndex >= exercises.length) return

    const currentExercise = exercises[currentIndex]
    if (currentExercise.config.measure !== 'time' || !currentExercise.config.targetValue) return

    const beepStartSeconds = userSettings?.beepStartSeconds || 3
    const targetValue = currentExercise.config.targetValue
    const secondsRemaining = targetValue - timeElapsed

    // Beep during countdown (3, 2, 1)
    if (secondsRemaining > 0 && secondsRemaining <= beepStartSeconds) {
      playBeep(600 + secondsRemaining * 100, 150) // Higher pitch for earlier beeps
    }

    // Final beep on completion (0)
    if (secondsRemaining === 0) {
      playBeep(1000, 300) // Higher pitch, longer duration for completion
    }
  }, [timeElapsed, exercises, currentIndex, userSettings?.beepStartSeconds, playBeep])

  // Check if current exercise is complete (for time-based with auto-advance)
  useEffect(() => {
    if (!exercises || currentIndex >= exercises.length) return

    const currentExercise = exercises[currentIndex]
    if (
      autoAdvance &&
      currentExercise.config.measure === 'time' &&
      currentExercise.config.targetValue &&
      timeElapsed >= currentExercise.config.targetValue
    ) {
      // Auto-advance for time-based exercises
      handleNextExercise()
    }
  }, [timeElapsed, exercises, currentIndex, autoAdvance])

  // Handle next exercise
  const handleNextExercise = useCallback(() => {
    if (!exercises) return

    const currentExercise = exercises[currentIndex]

    // Trigger haptic feedback on completion
    triggerHaptic([100, 50, 100]) // Double vibration pattern

    // Record completed exercise with actual value and active modifiers
    const completed: CompletedExercise = {
      exerciseId: currentExercise.exerciseId,
      startedAt: exerciseStartRef.current,
      completedAt: new Date(),
      value: currentExercise.config.measure === 'time'
        ? timeElapsed
        : actualValue,
      skipped: false,
      activeModifiers: activeModifiers.length > 0 ? activeModifiers : undefined,
    }

    setCompletedExercises((prev) => [...prev, completed])

    // Check if workout is complete
    if (currentIndex >= exercises.length - 1) {
      setIsCompleted(true)
      // Update execution with completed data
      if (executionId) {
        updateExecution.mutate({
          id: executionId,
          exercises: [...completedExercises, completed],
          completedAt: new Date(),
          totalPauseDuration: 0, // TODO: Track actual pause duration
        })
      }
    } else {
      // Move to next exercise
      setCurrentIndex((prev) => prev + 1)
      setTimeElapsed(0)
      exerciseStartRef.current = new Date()
    }
  }, [exercises, currentIndex, timeElapsed, actualValue, executionId, completedExercises, updateExecution, triggerHaptic, activeModifiers])

  // Handle skip
  const handleSkip = useCallback(() => {
    if (!exercises) return

    const currentExercise = exercises[currentIndex]

    // Record skipped exercise
    const skipped: CompletedExercise = {
      exerciseId: currentExercise.exerciseId,
      startedAt: exerciseStartRef.current,
      completedAt: new Date(),
      skipped: true,
    }

    setCompletedExercises((prev) => [...prev, skipped])

    // Check if workout is complete
    if (currentIndex >= exercises.length - 1) {
      setIsCompleted(true)
      if (executionId) {
        updateExecution.mutate({
          id: executionId,
          exercises: [...completedExercises, skipped],
          completedAt: new Date(),
          totalPauseDuration: 0,
        })
      }
    } else {
      setCurrentIndex((prev) => prev + 1)
      setTimeElapsed(0)
      exerciseStartRef.current = new Date()
    }
  }, [exercises, currentIndex, executionId, completedExercises, updateExecution])

  // Handle pause/resume
  const togglePause = () => {
    setIsPaused((prev) => !prev)
  }

  // Handle rating submit
  const handleSubmitRating = async () => {
    if (!executionId || rating === 0) return

    await submitRating.mutateAsync({
      id: executionId,
      rating,
      feedback: feedback || undefined,
    })

    navigate({ to: '/sequences' })
  }

  // Handle quit
  const handleQuit = () => {
    if (executionId) {
      updateExecution.mutate({
        id: executionId,
        exercises: completedExercises,
        completedAt: new Date(),
        totalPauseDuration: 0,
      })
    }
    navigate({ to: '/sequences' })
  }

  if (sequenceLoading || !sequence) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!exercises || exercises.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">This sequence has no exercises</p>
        <Button
          onClick={() => navigate({ to: '/sequences/$id/edit', params: { id: String(sequenceId) } })}
          className="mt-4"
        >
          Add Exercises
        </Button>
      </div>
    )
  }

  // Completed screen
  if (isCompleted) {
    const completedCount = completedExercises.filter((e) => !e.skipped).length
    const skippedCount = completedExercises.filter((e) => e.skipped).length

    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center gap-4 p-4 border-b">
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Workout Complete!</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Great job!</h2>
            <p className="text-muted-foreground">
              You completed {completedCount} exercises
              {skippedCount > 0 && ` (${skippedCount} skipped)`}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <label className="text-sm font-medium">How was your workout?</label>
              <div className="flex justify-center gap-2 mt-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div>
            <label className="text-sm font-medium">Feedback (optional)</label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="How did it go? Any notes for next time?"
              className="mt-1.5"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={handleSubmitRating}
              disabled={rating === 0 || submitRating.isPending}
            >
              {submitRating.isPending ? 'Saving...' : 'Save & Finish'}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate({ to: '/sequences' })}
            >
              Skip Rating
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Active workout screen
  const currentExercise = exercises[currentIndex]
  const isBreak = currentExercise.exerciseId === 'break'
  const isTimeBased = currentExercise.config.measure === 'time'
  const targetValue = currentExercise.config.targetValue || 0
  const progress = isTimeBased ? (timeElapsed / targetValue) * 100 : 0

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 md:px-8 border-b">
        <Button variant="ghost" size="icon" onClick={handleQuit} className="h-12 w-12 md:h-14 md:w-14">
          <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
        <div className="flex-1">
          <h1 className="text-sm md:text-base font-medium text-muted-foreground">
            {sequence.name}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Exercise {currentIndex + 1} of {exercises.length}
          </p>
        </div>
        <Badge
          onClick={() => setAutoAdvance(!autoAdvance)}
          className={`cursor-pointer px-3 py-1.5 md:px-4 md:py-2 gap-1 text-xs md:text-sm ${
            autoAdvance
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          }`}
        >
          {autoAdvance && <Check className="h-3 w-3 md:h-4 md:w-4" />}
          Auto-advance
        </Badge>
      </header>

      {/* Progress bar */}
      <Progress
        value={((currentIndex + (isTimeBased ? progress / 100 : 0)) / exercises.length) * 100}
        className="h-1 rounded-none"
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        {/* Exercise icon/indicator */}
        <div className="mb-6 md:mb-8">
          {isBreak ? (
            <Coffee className="h-16 w-16 md:h-24 md:w-24 text-muted-foreground" />
          ) : isTimeBased ? (
            <Clock className="h-16 w-16 md:h-24 md:w-24 text-primary" />
          ) : (
            <Repeat className="h-16 w-16 md:h-24 md:w-24 text-primary" />
          )}
        </div>

        {/* Exercise name */}
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-2 md:mb-4">
          {getExerciseName(currentExercise.exerciseId)}
        </h2>

        {/* Timer/Counter */}
        {isTimeBased ? (
          // Time-based display
          <div className="flex flex-col items-center mb-4 md:mb-8">
            <div
              className={`text-6xl md:text-8xl font-mono font-bold ${
                timeElapsed > targetValue
                  ? 'text-green-500'
                  : ''
              }`}
            >
              {timeElapsed <= targetValue
                ? Math.max(0, targetValue - timeElapsed)
                : `+${timeElapsed - targetValue}`}
            </div>
            {timeElapsed > targetValue && targetValue > 0 && (
              <div className="text-2xl md:text-3xl text-muted-foreground">
                /{targetValue}
              </div>
            )}
          </div>
        ) : (
          // Rep-based display with +/- buttons
          <div className="flex flex-col items-center mb-4 md:mb-8">
            <div className="flex items-center gap-4 md:gap-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setActualValue(Math.max(0, actualValue - 1))}
                className="h-12 w-12 md:h-16 md:w-16"
              >
                <Minus className="h-6 w-6 md:h-8 md:w-8" />
              </Button>
              <div className="flex flex-col items-center">
                <div
                  className={`text-6xl md:text-8xl font-mono font-bold ${
                    actualValue > targetValue
                      ? 'text-green-500'
                      : actualValue < targetValue
                      ? 'text-red-500'
                      : ''
                  }`}
                >
                  {actualValue}
                </div>
                {actualValue !== targetValue && targetValue > 0 && (
                  <div className="text-2xl md:text-3xl text-muted-foreground">
                    /{targetValue}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setActualValue(actualValue + 1)}
                className="h-12 w-12 md:h-16 md:w-16"
              >
                <Plus className="h-6 w-6 md:h-8 md:w-8" />
              </Button>
            </div>
          </div>
        )}

        <p className="text-muted-foreground md:text-lg mb-8 md:mb-12">
          {isTimeBased
            ? timeElapsed > targetValue
              ? 'seconds over target'
              : 'seconds remaining'
            : 'repetitions'}
        </p>

        {/* Progress for time-based */}
        {isTimeBased && (
          <div className="w-full max-w-xs md:max-w-md mb-8 md:mb-12">
            <Progress value={Math.min(progress, 100)} className="h-2 md:h-3" />
          </div>
        )}

        {/* Goal type indicator */}
        <p className="text-sm md:text-base text-muted-foreground capitalize mb-4">
          {currentExercise.config.goal} goal
        </p>

        {/* Active modifiers (only show if exercise has assigned modifiers) */}
        {!isBreak && currentExercise.modifiers && currentExercise.modifiers.length > 0 && (
          <div className="w-full max-w-sm md:max-w-md">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Package2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Active Equipment</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {currentExercise.modifiers.map((assignment) => {
                const modifier = allModifiers?.find((m) => m.id === assignment.modifierId)
                if (!modifier) return null

                const isActive = activeModifiers.some((am) => am.modifierId === assignment.modifierId)
                const effect = assignment.effect || 'neutral'
                const effectColor = effect === 'easier'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : effect === 'harder'
                  ? 'border-red-600 bg-red-50 text-red-700'
                  : 'border-blue-600 bg-blue-50 text-blue-700'

                return (
                  <button
                    key={assignment.modifierId}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        // Remove modifier
                        setActiveModifiers((prev) =>
                          prev.filter((am) => am.modifierId !== assignment.modifierId)
                        )
                      } else {
                        // Add modifier with its value
                        const val = modifier.value !== null && modifier.value !== undefined
                          ? `${modifier.value}${modifier.unit && modifier.unit !== 'none' && modifier.unit !== 'level' ? modifier.unit : ''}`
                          : undefined
                        setActiveModifiers((prev) => [
                          ...prev,
                          { modifierId: assignment.modifierId, value: val },
                        ])
                      }
                    }}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all
                      ${isActive
                        ? effectColor
                        : 'border-transparent bg-muted text-muted-foreground opacity-50'
                      }
                    `}
                  >
                    {isActive && <Check className="h-3 w-3" />}
                    <span className="text-sm font-medium">
                      {[
                        modifier.name,
                        modifier.value !== null && modifier.value !== undefined ? modifier.value : null,
                        modifier.unit && modifier.unit !== 'none' ? modifier.unit : null,
                      ].filter(Boolean).join(' ')}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Controls */}
      <div className="p-4 md:p-6 border-t">
        <div className="flex gap-3 md:gap-4 max-w-sm md:max-w-lg mx-auto">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-12 md:h-14 text-base md:text-lg"
            onClick={handleSkip}
          >
            <SkipForward className="h-5 w-5 md:h-6 md:w-6 mr-2" />
            Skip
          </Button>

          {isTimeBased ? (
            autoAdvance ? (
              <Button
                variant={isPaused ? 'default' : 'secondary'}
                size="lg"
                className="flex-1 h-12 md:h-14 text-base md:text-lg"
                onClick={togglePause}
              >
                {isPaused ? (
                  <>
                    <Play className="h-5 w-5 md:h-6 md:w-6 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-5 w-5 md:h-6 md:w-6 mr-2" />
                    Pause
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                className="flex-1 h-12 md:h-14 text-base md:text-lg"
                onClick={handleNextExercise}
              >
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 mr-2" />
                Done
              </Button>
            )
          ) : (
            <Button
              size="lg"
              className="flex-1 h-12 md:h-14 text-base md:text-lg"
              onClick={handleNextExercise}
            >
              <CheckCircle className="h-5 w-5 md:h-6 md:w-6 mr-2" />
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
