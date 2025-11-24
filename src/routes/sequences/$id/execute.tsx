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
} from 'lucide-react'
import type { SequenceExercise, CompletedExercise } from '@/db/types'

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

  // Rating state
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')

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

  // Check if current exercise is complete (for time-based)
  useEffect(() => {
    if (!exercises || currentIndex >= exercises.length) return

    const currentExercise = exercises[currentIndex]
    if (
      currentExercise.config.measure === 'time' &&
      currentExercise.config.targetValue &&
      timeElapsed >= currentExercise.config.targetValue
    ) {
      // Auto-advance for time-based exercises
      handleNextExercise()
    }
  }, [timeElapsed, exercises, currentIndex])

  // Handle next exercise
  const handleNextExercise = useCallback(() => {
    if (!exercises) return

    const currentExercise = exercises[currentIndex]

    // Record completed exercise
    const completed: CompletedExercise = {
      exerciseId: currentExercise.exerciseId,
      startedAt: exerciseStartRef.current,
      completedAt: new Date(),
      value: currentExercise.config.measure === 'time'
        ? timeElapsed
        : currentExercise.config.targetValue,
      skipped: false,
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
  }, [exercises, currentIndex, timeElapsed, executionId, completedExercises, updateExecution])

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
      <header className="flex items-center gap-4 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={handleQuit}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-sm font-medium text-muted-foreground">
            {sequence.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            Exercise {currentIndex + 1} of {exercises.length}
          </p>
        </div>
      </header>

      {/* Progress bar */}
      <Progress
        value={((currentIndex + (isTimeBased ? progress / 100 : 0)) / exercises.length) * 100}
        className="h-1 rounded-none"
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Exercise icon/indicator */}
        <div className="mb-6">
          {isBreak ? (
            <Coffee className="h-16 w-16 text-muted-foreground" />
          ) : isTimeBased ? (
            <Clock className="h-16 w-16 text-primary" />
          ) : (
            <Repeat className="h-16 w-16 text-primary" />
          )}
        </div>

        {/* Exercise name */}
        <h2 className="text-2xl font-bold text-center mb-2">
          {getExerciseName(currentExercise.exerciseId)}
        </h2>

        {/* Timer/Counter */}
        <div className="text-6xl font-mono font-bold mb-4">
          {isTimeBased ? (
            // Countdown for time-based
            Math.max(0, targetValue - timeElapsed)
          ) : (
            // Target for rep-based
            targetValue
          )}
        </div>

        <p className="text-muted-foreground mb-8">
          {isTimeBased ? 'seconds remaining' : 'repetitions'}
        </p>

        {/* Progress for time-based */}
        {isTimeBased && (
          <div className="w-full max-w-xs mb-8">
            <Progress value={Math.min(progress, 100)} className="h-2" />
          </div>
        )}

        {/* Goal type indicator */}
        <p className="text-sm text-muted-foreground capitalize">
          {currentExercise.config.goal} goal
        </p>
      </main>

      {/* Controls */}
      <div className="p-4 border-t">
        <div className="flex gap-3 max-w-sm mx-auto">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={handleSkip}
          >
            <SkipForward className="h-5 w-5 mr-2" />
            Skip
          </Button>

          {isTimeBased ? (
            <Button
              variant={isPaused ? 'default' : 'secondary'}
              size="lg"
              className="flex-1"
              onClick={togglePause}
            >
              {isPaused ? (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </>
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              className="flex-1"
              onClick={handleNextExercise}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
