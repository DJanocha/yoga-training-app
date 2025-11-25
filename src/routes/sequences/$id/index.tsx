import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useTRPC } from '@/lib/trpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RedirectToSignIn, SignedIn, AuthLoading } from '@/components/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Play,
  Clock,
  Repeat,
  Coffee,
  Heart,
} from 'lucide-react'
import type { SequenceExercise } from '@/db/types'

export const Route = createFileRoute('/sequences/$id/')({
  component: SequenceDetail,
})

function SequenceDetail() {
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
        <SequenceDetailContent sequenceId={sequenceId} />
      </SignedIn>
    </>
  )
}

function SequenceDetailContent({ sequenceId }: { sequenceId: number }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: sequence, isLoading } = useQuery(
    trpc.sequences.byId.queryOptions({ id: sequenceId })
  )

  const { data: allExercises } = useQuery(trpc.exercises.list.queryOptions())

  const deleteSequence = useMutation(
    trpc.sequences.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.sequences.list.queryKey() })
        navigate({ to: '/sequences' })
      },
    })
  )

  const toggleFavorite = useMutation(
    trpc.sequences.toggleFavorite.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.sequences.byId.queryKey() })
        queryClient.invalidateQueries({ queryKey: trpc.sequences.list.queryKey() })
      },
    })
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!sequence) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Sequence not found</p>
        <Button
          onClick={() => navigate({ to: '/sequences' })}
          className="mt-4"
        >
          Back to Sequences
        </Button>
      </div>
    )
  }

  const exercises = sequence.exercises as SequenceExercise[]

  // Calculate total duration
  const totalDuration = exercises.reduce((acc, item) => {
    if (item.config.measure === 'time' && item.config.targetValue) {
      return acc + item.config.targetValue
    }
    return acc
  }, 0)

  // Get exercise name by ID
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
          onClick={() => navigate({ to: '/sequences' })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{sequence.name}</h1>
          <p className="text-sm text-muted-foreground">
            {exercises.length} exercises • {Math.floor(totalDuration / 60)}m {totalDuration % 60}s • <span className="capitalize">{sequence.goal || 'elastic'} mode</span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggleFavorite.mutate({ id: sequenceId })}
        >
          <Heart className={`h-5 w-5 ${sequence.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
        <Link to="/sequences/$id/edit" params={{ id: String(sequenceId) }}>
          <Button variant="outline" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Sequence</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{sequence.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteSequence.mutate({ id: sequenceId })}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Level & Category */}
        <div className="flex flex-wrap gap-2">
          {sequence.level && (
            <Badge variant="secondary" className="capitalize">
              {sequence.level}
            </Badge>
          )}
          {sequence.category && (
            <Badge variant="outline" className="capitalize">
              {sequence.category}
            </Badge>
          )}
          {sequence.isFavorite && (
            <Badge variant="default" className="bg-red-500">
              Favorite
            </Badge>
          )}
        </div>

        {/* Description */}
        {sequence.description && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {sequence.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Exercises List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Exercises ({exercises.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {exercises.length > 0 ? (
              <div className="space-y-2">
                {exercises.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 bg-muted/50 rounded"
                  >
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    {item.exerciseId === 'break' ? (
                      <Coffee className="h-4 w-4 text-muted-foreground" />
                    ) : null}
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {getExerciseName(item.exerciseId)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {item.config.measure === 'time' ? (
                          <>
                            <Clock className="h-3 w-3" />
                            <span>{item.config.targetValue}s</span>
                          </>
                        ) : (
                          <>
                            <Repeat className="h-3 w-3" />
                            <span>{item.config.targetValue} reps</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No exercises in this sequence yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Start Workout Button */}
        <Link to="/sequences/$id/execute" params={{ id: String(sequenceId) }}>
          <Button className="w-full" size="lg" disabled={exercises.length === 0}>
            <Play className="h-5 w-5 mr-2" />
            Start Workout
          </Button>
        </Link>
      </main>
    </div>
  )
}
