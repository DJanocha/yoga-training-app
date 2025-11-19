import { createFileRoute } from '@tanstack/react-router'
import { ExerciseList } from '@/components/ExerciseList'
import { RedirectToSignIn, SignedIn, AuthLoading } from 'better-auth-ui'

export const Route = createFileRoute('/exercises/')({
  component: Exercises,
})

function Exercises() {
  return (
    <>
      <AuthLoading>
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AuthLoading>
      <RedirectToSignIn />
      <SignedIn>
        <ExerciseList />
      </SignedIn>
    </>
  )
}
