import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SequenceBuilder } from '@/components/SequenceBuilder'
import { RedirectToSignIn, SignedIn, AuthLoading } from '@/components/auth'

export const Route = createFileRoute('/sequences/$id/edit')({
  component: EditSequence,
})

function EditSequence() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const sequenceId = parseInt(id, 10)

  if (isNaN(sequenceId)) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Invalid sequence ID</p>
        <button
          type="button"
          onClick={() => navigate({ to: '/sequences' })}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Back to Sequences
        </button>
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
        <SequenceBuilder sequenceId={sequenceId} />
      </SignedIn>
    </>
  )
}
