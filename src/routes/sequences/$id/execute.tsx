import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useTRPC } from '@/lib/trpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RedirectToSignIn, SignedIn, AuthLoading } from '@/components/auth'
import { Button } from '@/components/ui/button'
import { SegmentedProgress, type ExerciseStatus } from '@/components/ui/segmented-progress'
import { Progress } from '@/components/ui/progress'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ExercisePickerDrawer } from '@/components/exercise-picker-drawer'
import { ExerciseConfigUpdateDialog, type UpdateScope } from '@/components/exercise-config-update-dialog'
import { GameTimer } from '@/components/ui/game-timer'
import { GameCounter } from '@/components/ui/game-counter'
import { EquipmentGrid } from '@/components/ui/equipment-grid'
import type { ExercisePickerConfig } from '@/components/exercise-picker-drawer'
import type { MeasureType, ExerciseGroup } from '@/db/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  RotateCcw,
  Eye,
  Pencil,
} from 'lucide-react'
import type { SequenceExercise, CompletedExercise, ActiveModifier, ModifierEffect } from '@/db/types'
import { toast } from 'sonner'

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
  const updateSequence = useMutation(
    trpc.sequences.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.sequences.byId.queryKey({ id: sequenceId }) })
        toast.success('Exercise saved to sequence')
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
  const [actualValue, setActualValue] = useState<number>(0)

  // Rating state
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')

  // Active modifiers state (per-exercise during execution)
  const [activeModifiers, setActiveModifiers] = useState<ActiveModifier[]>([])

  // Add Exercise during workout state
  const [workoutExercises, setWorkoutExercises] = useState<SequenceExercise[] | null>(null)
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [pendingExerciseToAdd, setPendingExerciseToAdd] = useState<{ exerciseId: number, config: ExercisePickerConfig } | null>(null)

  // Review mode state (Phase 18.1)
  const [viewingIndex, setViewingIndex] = useState<number | null>(null)
  const isReviewing = viewingIndex !== null

  // Config update dialog state (Phase 18.3)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [pendingConfigChange, setPendingConfigChange] = useState<{
    oldConfig: { measure: MeasureType; targetValue?: number }
    newConfig: { measure: MeasureType; targetValue?: number }
  } | null>(null)

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const exerciseStartRef = useRef<Date>(new Date())
  const hasStartedRef = useRef(false)

  // Get exercises from sequence (use workoutExercises if modified)
  const exercises = (workoutExercises ?? sequence?.exercises) as SequenceExercise[] | undefined

  // Get exercise name
  const getExerciseName = useCallback((exerciseId: number | 'break'): string => {
    if (exerciseId === 'break') return 'Break'
    return allExercises?.find((ex) => ex.id === exerciseId)?.name || `Exercise #${exerciseId}`
  }, [allExercises])

  // Get group context for current exercise
  const getGroupContext = useCallback((exerciseIndex: number): { group: ExerciseGroup; position: number; total: number } | null => {
    if (!exercises || !sequence) return null

    const groups = (sequence as any).groups as ExerciseGroup[] | undefined
    if (!groups || groups.length === 0) return null

    const currentExercise = exercises[exerciseIndex]
    if (!currentExercise?.id) return null

    for (const group of groups) {
      const positionInGroup = group.exerciseIds.indexOf(currentExercise.id)
      if (positionInGroup !== -1) {
        return {
          group,
          position: positionInGroup + 1,
          total: group.exerciseIds.length,
        }
      }
    }

    return null
  }, [exercises, sequence])

  // Get exercise status for segmented progress bar
  const getExerciseStatus = useCallback((index: number): ExerciseStatus => {
    if (index === currentIndex && !isReviewing) return 'current'
    if (index < completedExercises.length) {
      const completed = completedExercises[index]
      return completed?.skipped ? 'skipped' : 'completed'
    }
    return 'pending'
  }, [currentIndex, completedExercises, isReviewing])

  // Handle navigation from segmented progress bar
  const handleProgressNavigate = useCallback((targetIndex: number) => {
    if (targetIndex === currentIndex) {
      // Clicking current exercise exits review mode
      setViewingIndex(null)
    } else if (targetIndex < currentIndex) {
      // Navigating to past exercise enters review mode
      setViewingIndex(targetIndex)
    }
    // Cannot navigate to future exercises (targetIndex > currentIndex)
  }, [currentIndex])

  // Handle redo from review mode
  const handleRedo = useCallback(() => {
    if (viewingIndex === null || !exercises) return

    // Remove all completed exercises from viewingIndex onwards
    setCompletedExercises(prev => prev.slice(0, viewingIndex))

    // Reset to the viewing index
    setCurrentIndex(viewingIndex)
    setTimeElapsed(0)

    // Reset actual value to target value of that exercise
    const targetExercise = exercises[viewingIndex]
    if (targetExercise) {
      setActualValue(targetExercise.config.targetValue || 0)
    }

    // Exit review mode
    setViewingIndex(null)

    // Restart exercise timer
    exerciseStartRef.current = new Date()

    toast.success('Exercise reset. Continue from here!')
  }, [viewingIndex, exercises])

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

  // Handle exercise selected from picker
  const handleExerciseSelected = useCallback((exerciseId: number, config: ExercisePickerConfig, saveToSequence: boolean) => {
    if (!sequence) return

    const currentExercises = workoutExercises ?? [...(sequence.exercises as SequenceExercise[])]

    const newExercise: SequenceExercise = {
      id: `${exerciseId}-${Date.now()}`,
      exerciseId,
      config: {
        measure: config.measure,
        targetValue: config.targetValue,
      },
    }

    // Insert before or after current index based on position
    const insertIndex = config.position === 'before' ? currentIndex : currentIndex + 1
    const updatedExercises = [
      ...currentExercises.slice(0, insertIndex),
      newExercise,
      ...currentExercises.slice(insertIndex),
    ]

    setWorkoutExercises(updatedExercises)

    // If inserting before, increment currentIndex to stay on the same exercise
    if (config.position === 'before') {
      setCurrentIndex(prev => prev + 1)
    }

    // If user wants to save to sequence permanently
    if (saveToSequence) {
      updateSequence.mutate({
        id: sequenceId,
        exercises: updatedExercises,
      })
    } else {
      const positionText = config.position === 'before' ? 'before' : 'after'
      toast.success(`Exercise added ${positionText} current`)
    }

    triggerHaptic(200)
  }, [sequence, workoutExercises, currentIndex, sequenceId, updateSequence, triggerHaptic])

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
      // Pre-select all assigned modifiers with their values and effects
      if (currentExercise.modifiers && currentExercise.modifiers.length > 0) {
        const initialActiveModifiers: ActiveModifier[] = currentExercise.modifiers.map((m) => {
          const modifier = allModifiers?.find((mod) => mod.id === m.modifierId)
          return {
            modifierId: m.modifierId,
            value: modifier?.value !== null && modifier?.value !== undefined
              ? `${modifier.value}${modifier.unit && modifier.unit !== 'none' && modifier.unit !== 'level' ? modifier.unit : ''}`
              : undefined,
            effect: m.effect || 'neutral', // Use pre-assigned effect
          }
        })
        setActiveModifiers(initialActiveModifiers)
      } else {
        setActiveModifiers([])
      }
    }
  }, [currentIndex, exercises, allModifiers])

  // Timer effect - pauses when in review mode
  useEffect(() => {
    if (!isPaused && !isCompleted && !isReviewing && exercises && currentIndex < exercises.length) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPaused, isCompleted, isReviewing, exercises, currentIndex])

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

  // Auto-advance for strict mode sequences (time-based exercises only)
  useEffect(() => {
    if (!exercises || !sequence || currentIndex >= exercises.length) return

    const currentExercise = exercises[currentIndex]
    const goal = (sequence as any).goal || 'elastic'

    if (
      goal === 'strict' &&
      currentExercise.config.measure === 'time' &&
      currentExercise.config.targetValue &&
      timeElapsed >= currentExercise.config.targetValue
    ) {
      // Auto-advance for time-based exercises in strict mode
      handleNextExercise()
    }
  }, [timeElapsed, exercises, currentIndex, sequence])

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

  // Open config edit dialog (Phase 18.3)
  const handleOpenConfigDialog = useCallback(() => {
    if (!exercises) return
    const currentExercise = exercises[currentIndex]

    setPendingConfigChange({
      oldConfig: {
        measure: currentExercise.config.measure,
        targetValue: currentExercise.config.targetValue,
      },
      newConfig: {
        measure: currentExercise.config.measure,
        targetValue: actualValue,
      },
    })
    setShowConfigDialog(true)
  }, [exercises, currentIndex, actualValue])

  // Apply config update (Phase 18.3)
  const handleApplyConfigUpdate = useCallback((
    _scope: UpdateScope,
    indicesToUpdate: number[],
    newConfig: { measure?: MeasureType; targetValue?: number },
    persistToSequence: boolean
  ) => {
    if (!exercises || !sequence) return

    // Create a copy of the workout exercises
    const updatedExercises = [...(workoutExercises ?? exercises)]

    // Update all matching exercises
    for (const idx of indicesToUpdate) {
      const exercise = updatedExercises[idx]
      if (exercise) {
        updatedExercises[idx] = {
          ...exercise,
          config: {
            ...exercise.config,
            ...(newConfig.measure !== undefined && { measure: newConfig.measure }),
            ...(newConfig.targetValue !== undefined && { targetValue: newConfig.targetValue }),
          },
        }
      }
    }

    // Update local state
    setWorkoutExercises(updatedExercises)

    // Also update actualValue if current exercise was updated
    if (indicesToUpdate.includes(currentIndex) && newConfig.targetValue !== undefined) {
      setActualValue(newConfig.targetValue)
    }

    // Persist to sequence if requested
    if (persistToSequence) {
      updateSequence.mutate({
        id: sequenceId,
        exercises: updatedExercises,
      })
    }

    toast.success(`Updated ${indicesToUpdate.length} exercise${indicesToUpdate.length > 1 ? 's' : ''}`)

    // Clear pending state
    setPendingConfigChange(null)
    setShowConfigDialog(false)
  }, [exercises, sequence, workoutExercises, currentIndex, sequenceId, updateSequence])

  // Cancel config update
  const handleCancelConfigUpdate = useCallback(() => {
    setPendingConfigChange(null)
    setShowConfigDialog(false)
  }, [])

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
  // When reviewing, show the viewed exercise; otherwise show current
  const displayIndex = viewingIndex ?? currentIndex
  const displayExercise = exercises[displayIndex]
  const isBreak = displayExercise.exerciseId === 'break'
  const isTimeBased = displayExercise.config.measure === 'time'
  const targetValue = displayExercise.config.targetValue || 0
  const progress = isTimeBased ? (timeElapsed / targetValue) * 100 : 0

  // When reviewing, get modifiers from completed exercise record
  const reviewedExercise = isReviewing && viewingIndex !== null ? completedExercises[viewingIndex] : null
  const displayModifiers = isReviewing && reviewedExercise?.activeModifiers
    ? reviewedExercise.activeModifiers
    : activeModifiers

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
            Exercise {displayIndex + 1} of {exercises.length}
            {(() => {
              const groupContext = getGroupContext(displayIndex)
              if (groupContext) {
                return ` · ${groupContext.group.name} (${groupContext.position}/${groupContext.total})`
              }
              return null
            })()}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setExercisePickerOpen(true)}
          className="h-12 w-12 md:h-14 md:w-14"
        >
          <Plus className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
      </header>

      {/* Segmented Progress Bar with Navigation */}
      <SegmentedProgress
        totalExercises={exercises.length}
        currentIndex={currentIndex}
        viewingIndex={viewingIndex}
        onNavigate={handleProgressNavigate}
        getExerciseStatus={getExerciseStatus}
        className="border-b"
      />

      {/* Review Mode Banner */}
      {isReviewing && viewingIndex !== null && (
        <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 px-4 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Reviewing Exercise {viewingIndex + 1} of {exercises.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingIndex(null)}
                className="h-8"
              >
                Resume
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleRedo}
                className="h-8 bg-blue-600 hover:bg-blue-700"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Redo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={`flex-1 flex flex-col items-center justify-center p-2 md:p-6 min-h-0 ${isReviewing ? 'opacity-60' : ''}`}>
        {/* Exercise name with icon and edit button */}
        <div className="flex items-center gap-2 mb-2 md:mb-4">
          {isBreak ? (
            <Coffee className="h-6 w-6 md:h-10 md:w-10 text-muted-foreground" />
          ) : isTimeBased ? (
            <Clock className="h-6 w-6 md:h-10 md:w-10 text-primary" />
          ) : (
            <Repeat className="h-6 w-6 md:h-10 md:w-10 text-primary" />
          )}
          <h2 className="text-lg md:text-3xl font-bold text-center">
            {getExerciseName(displayExercise.exerciseId)}
          </h2>
          {/* Edit Config Button - only show for non-break exercises when not reviewing */}
          {!isBreak && !isReviewing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenConfigDialog}
              className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground hover:text-foreground"
              title="Edit exercise configuration"
            >
              <Pencil className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          )}
        </div>

        {/* Game-style layout: Equipment (left) | Timer/Counter (right) */}
        {(() => {
          // Get equipment data
          const sequenceAvailableModifiers = (sequence as any)?.availableModifiers as number[] | undefined
          const hasEquipment = sequenceAvailableModifiers && sequenceAvailableModifiers.length > 0

          // Transform modifiers to equipment items
          const equipmentItems = hasEquipment
            ? sequenceAvailableModifiers.map((modifierId) => {
                const modifier = allModifiers?.find((m) => m.id === modifierId)
                return modifier ? {
                  id: modifier.id,
                  name: modifier.name,
                  value: modifier.value,
                  unit: modifier.unit,
                } : null
              }).filter((item): item is NonNullable<typeof item> => item !== null)
            : []

          // Transform active modifiers to equipment format
          const activeEquipment = displayModifiers.map((am) => ({
            id: am.modifierId,
            effect: am.effect || 'neutral' as ModifierEffect,
          }))

          // Handler for equipment toggle
          const handleEquipmentToggle = (itemId: number, newEffect: ModifierEffect | null) => {
            const modifier = allModifiers?.find((m) => m.id === itemId)
            if (!modifier) return

            const updateModifiers = (updater: (prev: ActiveModifier[]) => ActiveModifier[]) => {
              if (isReviewing && viewingIndex !== null) {
                setCompletedExercises(prev => prev.map((ex, i) =>
                  i === viewingIndex
                    ? { ...ex, activeModifiers: updater(ex.activeModifiers || []) }
                    : ex
                ))
              } else {
                setActiveModifiers(updater)
              }
            }

            if (newEffect === null) {
              // Turn off
              updateModifiers((prev) => prev.filter((am) => am.modifierId !== itemId))
            } else {
              const val = modifier.value !== null && modifier.value !== undefined
                ? `${modifier.value}${modifier.unit && modifier.unit !== 'none' && modifier.unit !== 'level' ? modifier.unit : ''}`
                : undefined
              const existing = displayModifiers.find((am) => am.modifierId === itemId)
              if (existing) {
                // Update effect
                updateModifiers((prev) =>
                  prev.map((am) =>
                    am.modifierId === itemId ? { ...am, effect: newEffect } : am
                  )
                )
              } else {
                // Add new
                updateModifiers((prev) => [
                  ...prev,
                  { modifierId: itemId, value: val, effect: newEffect },
                ])
              }
            }
          }

          return (
            <div className={`flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 w-full max-w-4xl ${!hasEquipment ? 'md:justify-center' : ''}`}>
              {/* Equipment Grid (left side) - only show if there are modifiers */}
              {hasEquipment && !isBreak && (
                <div className="order-2 md:order-1">
                  <EquipmentGrid
                    items={equipmentItems}
                    activeItems={activeEquipment}
                    onToggle={handleEquipmentToggle}
                    cols={3}
                    rows={1}
                    editable={true}
                  />
                </div>
              )}

              {/* Timer/Counter (right side or center if no equipment) */}
              <div className="order-1 md:order-2">
                {isTimeBased ? (
                  // Time-based: GameTimer
                  <GameTimer
                    seconds={timeElapsed <= targetValue
                      ? Math.max(0, targetValue - timeElapsed)
                      : timeElapsed - targetValue
                    }
                    editable={false}
                    label={timeElapsed > targetValue ? 'Over Target' : 'Remaining'}
                    theme={timeElapsed > targetValue ? 'orange' : 'emerald'}
                  />
                ) : (
                  // Rep-based: GameCounter
                  <GameCounter
                    value={actualValue}
                    onChange={setActualValue}
                    target={targetValue > 0 ? targetValue : undefined}
                    label="Reps"
                    theme={actualValue >= targetValue && targetValue > 0 ? 'cyan' : 'lime'}
                    min={0}
                    max={999}
                  />
                )}
              </div>
            </div>
          )
        })()}

        {/* Progress for time-based */}
        {isTimeBased && (
          <div className="w-full max-w-xs md:max-w-md mt-3 md:mt-6">
            <Progress value={Math.min(progress, 100)} className="h-2 md:h-3" />
          </div>
        )}

        {/* Goal type indicator */}
        <p className="text-xs md:text-base text-muted-foreground capitalize mt-2 md:mt-4">
          {sequence?.goal || 'elastic'} goal
        </p>
      </main>

      {/* Controls */}
      <div className="p-3 md:p-6 border-t shrink-0">
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
            ((sequence as any)?.goal || 'elastic') === 'strict' ? (
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

      {/* Exercise Picker Drawer */}
      <ExercisePickerDrawer
        open={exercisePickerOpen}
        onOpenChange={setExercisePickerOpen}
        onExerciseSelected={(exerciseId, config) => {
          setPendingExerciseToAdd({ exerciseId, config })
          setShowSavePrompt(true)
        }}
        showPositionOption
        title="Add Exercise"
        description="Select an exercise to add"
      />

      {/* Save to Sequence Prompt */}
      <AlertDialog open={showSavePrompt} onOpenChange={setShowSavePrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save to sequence?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to save this exercise to the sequence permanently, or just add it for this workout?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={() => {
                if (pendingExerciseToAdd !== null) {
                  handleExerciseSelected(
                    pendingExerciseToAdd.exerciseId,
                    pendingExerciseToAdd.config,
                    false
                  )
                  setPendingExerciseToAdd(null)
                }
              }}
            >
              This workout only
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingExerciseToAdd !== null) {
                  handleExerciseSelected(
                    pendingExerciseToAdd.exerciseId,
                    pendingExerciseToAdd.config,
                    true
                  )
                  setPendingExerciseToAdd(null)
                }
              }}
            >
              Save permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exercise Config Update Dialog (Phase 18.3) */}
      {pendingConfigChange && exercises && (
        <ExerciseConfigUpdateDialog
          open={showConfigDialog}
          onOpenChange={setShowConfigDialog}
          exercise={exercises[currentIndex]}
          exerciseIndex={currentIndex}
          exerciseName={getExerciseName(exercises[currentIndex].exerciseId)}
          oldConfig={pendingConfigChange.oldConfig}
          newConfig={pendingConfigChange.newConfig}
          exercises={exercises}
          groups={(sequence as { groups?: ExerciseGroup[] })?.groups}
          completedCount={completedExercises.length}
          onApply={handleApplyConfigUpdate}
          onCancel={handleCancelConfigUpdate}
        />
      )}
    </div>
  )
}
