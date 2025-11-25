import { createFileRoute } from '@tanstack/react-router'
import { ModifierList } from '@/components/ModifierList'
import { RedirectToSignIn, SignedIn, AuthLoading } from '@/components/auth'
import { ListPageSkeleton } from '@/components/skeletons'

export const Route = createFileRoute('/modifiers/')({
  component: Modifiers,
})

function Modifiers() {
  return (
    <>
      <AuthLoading>
        <ListPageSkeleton />
      </AuthLoading>
      <RedirectToSignIn />
      <SignedIn>
        <ModifierList />
      </SignedIn>
    </>
  )
}
