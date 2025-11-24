import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ExerciseForm } from '@/components/ExerciseForm'
import { RedirectToSignIn, SignedIn, AuthLoading } from '@/components/auth'

export const Route = createFileRoute('/exercises/$id/edit')({
  component: EditExercise,
})

function EditExercise() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const exerciseId = parseInt(id, 10)

  const handleClose = () => {
    navigate({ to: '/exercises' })
  }

  if (isNaN(exerciseId)) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Invalid exercise ID</p>
        <button
          onClick={handleClose}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Exercises
        </button>
      </div>
    )
  }

  return (
    <>
      <AuthLoading>
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AuthLoading>
      <RedirectToSignIn />
      <SignedIn>
        <ExerciseForm exerciseId={exerciseId} onClose={handleClose} />
      </SignedIn>
    </>
  )
}
