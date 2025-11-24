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
  ExternalLink,
  Image,
  Video,
  Lightbulb,
  List,
} from 'lucide-react'

export const Route = createFileRoute('/exercises/$id/')({
  component: ExerciseDetail,
})

function ExerciseDetail() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const exerciseId = parseInt(id, 10)

  if (isNaN(exerciseId)) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Invalid exercise ID</p>
        <Button
          onClick={() => navigate({ to: '/exercises' })}
          className="mt-4"
        >
          Back to Exercises
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
        <ExerciseDetailContent exerciseId={exerciseId} />
      </SignedIn>
    </>
  )
}

function ExerciseDetailContent({ exerciseId }: { exerciseId: number }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: exercise, isLoading } = useQuery(
    trpc.exercises.byId.queryOptions({ id: exerciseId })
  )

  const deleteExercise = useMutation(
    trpc.exercises.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.exercises.list.queryKey() })
        navigate({ to: '/exercises' })
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

  if (!exercise) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Exercise not found</p>
        <Button
          onClick={() => navigate({ to: '/exercises' })}
          className="mt-4"
        >
          Back to Exercises
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: '/exercises' })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{exercise.name}</h1>
          {exercise.category && (
            <p className="text-sm text-muted-foreground capitalize">
              {exercise.category}
            </p>
          )}
        </div>
        <Link to="/exercises/$id/edit" params={{ id: String(exerciseId) }}>
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
              <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{exercise.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteExercise.mutate({ id: exerciseId })}
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
        {/* Level & Body Parts */}
        <div className="flex flex-wrap gap-2">
          {exercise.level && (
            <Badge variant="secondary" className="capitalize">
              {exercise.level}
            </Badge>
          )}
          {exercise.bodyParts && (exercise.bodyParts as string[]).map((part) => (
            <Badge key={part} variant="outline" className="capitalize">
              {part}
            </Badge>
          ))}
        </div>

        {/* Description */}
        {exercise.description && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {exercise.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        {exercise.tips && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {exercise.tips}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Modifications */}
        {exercise.modifications && (exercise.modifications as string[]).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <List className="h-4 w-4" />
                Modifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {(exercise.modifications as string[]).map((mod, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {mod}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Photos */}
        {exercise.photoUrls && (exercise.photoUrls as string[]).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Image className="h-4 w-4" />
                Photos ({(exercise.photoUrls as string[]).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {(exercise.photoUrls as string[]).map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-video bg-muted rounded-lg overflow-hidden group"
                  >
                    <img
                      src={url}
                      alt={`${exercise.name} photo ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink className="h-5 w-5 text-white" />
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Videos */}
        {exercise.videoUrls && (exercise.videoUrls as string[]).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Video className="h-4 w-4" />
                Videos ({(exercise.videoUrls as string[]).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(exercise.videoUrls as string[]).map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate flex-1">{url}</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Links */}
        {exercise.links && (exercise.links as string[]).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Links ({(exercise.links as string[]).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(exercise.links as string[]).map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate flex-1">{url}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
