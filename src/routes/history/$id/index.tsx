import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTRPC } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
import { RedirectToSignIn, SignedIn, AuthLoading } from '@/components/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Star,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { format } from 'date-fns'

export const Route = createFileRoute('/history/$id/')({
  component: WorkoutDetail,
})

function WorkoutDetail() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const executionId = parseInt(id, 10)

  if (isNaN(executionId)) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Invalid workout ID</p>
        <Button
          onClick={() => navigate({ to: '/history' })}
          className="mt-4"
        >
          Back to History
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
        <WorkoutDetailContent executionId={executionId} />
      </SignedIn>
    </>
  )
}

function WorkoutDetailContent({ executionId }: { executionId: number }) {
  const trpc = useTRPC()
  const navigate = useNavigate()

  // Fetch workout by ID
  const { data: workout, isLoading } = useQuery(
    trpc.executions.byId.queryOptions({ id: executionId })
  )

  // Fetch all exercises for names
  const { data: allExercises } = useQuery(trpc.exercises.list.queryOptions())

  // Fetch all modifiers for names
  const { data: allModifiers } = useQuery(trpc.modifiers.list.queryOptions())

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Workout not found</p>
        <Button
          onClick={() => navigate({ to: '/history' })}
          className="mt-4"
        >
          Back to History
        </Button>
      </div>
    )
  }

  const startedAt = new Date(workout.startedAt)
  const completedAt = workout.completedAt ? new Date(workout.completedAt) : null
  const duration = completedAt
    ? Math.round((completedAt.getTime() - startedAt.getTime()) / 1000 / 60)
    : 0

  // Get exercise name helper
  const getExerciseName = (exerciseId: number | 'break'): string => {
    if (exerciseId === 'break') return 'Break'
    return allExercises?.find((ex) => ex.id === exerciseId)?.name || `Exercise #${exerciseId}`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: '/history' })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{workout.sequenceName}</h1>
          <p className="text-sm text-muted-foreground">
            {format(startedAt, 'PPP')} at {format(startedAt, 'p')}
          </p>
        </div>
        {workout.rating && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < (workout.rating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stats Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{duration}m</p>
                  <p className="text-xs text-muted-foreground">Duration</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{workout.completedCount}</p>
                  <p className="text-xs text-muted-foreground">Exercises</p>
                </div>
              </div>
              {workout.personalRecords && workout.personalRecords > 0 && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{workout.personalRecords}</p>
                    <p className="text-xs text-muted-foreground">Personal Records</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feedback */}
        {workout.feedback && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {workout.feedback}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Exercise Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Exercise Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workout.exercises?.map((exercise: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <div>
                      <p className="font-medium text-sm">
                        {getExerciseName(exercise.exerciseId)}
                      </p>
                      {exercise.value && (
                        <p className="text-xs text-muted-foreground">
                          {exercise.value} {exercise.measure === 'time' ? 'seconds' : 'reps'}
                        </p>
                      )}
                      {exercise.activeModifiers && exercise.activeModifiers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {exercise.activeModifiers.map((am: any, idx: number) => {
                            const modifier = allModifiers?.find(m => m.id === am.modifierId)
                            if (!modifier) return null
                            const displayText = [
                              modifier.name,
                              am.value || (modifier.value !== null && modifier.value !== undefined ? modifier.value : null),
                              modifier.unit && modifier.unit !== 'none' ? modifier.unit : null,
                            ].filter(Boolean).join(' ')
                            return (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {displayText}
                              </Badge>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  {exercise.skipped ? (
                    <Badge variant="outline" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Skipped
                    </Badge>
                  ) : (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Done
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
