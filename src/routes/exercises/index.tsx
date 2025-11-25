import { createFileRoute } from '@tanstack/react-router'
import { ExerciseList } from '@/components/ExerciseList'
import { RedirectToSignIn, SignedIn, AuthLoading } from '@/components/auth'
import { ListPageSkeleton } from '@/components/skeletons'

export const Route = createFileRoute('/exercises/')({
  component: Exercises,
})

function Exercises() {
  return (
    <>
      <AuthLoading>
        <ListPageSkeleton />
      </AuthLoading>
      <RedirectToSignIn />
      <SignedIn>
        <ExerciseList />
      </SignedIn>
    </>
  )
}
