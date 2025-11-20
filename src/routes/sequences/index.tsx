import { createFileRoute, Link } from '@tanstack/react-router'
import { useTRPC } from '@/lib/trpc'
import { RedirectToSignIn, SignedIn, AuthLoading } from 'better-auth-ui'
import { useQuery } from '@tanstack/react-query'
import { ListOrdered } from 'lucide-react'
import { MobilePageHeader } from '@/components/mobile-page-header'
import { EmptyState } from '@/components/empty-state'

export const Route = createFileRoute('/sequences/')({
  component: Sequences,
})

function Sequences() {
  return (
    <>
      <AuthLoading>
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AuthLoading>
      <RedirectToSignIn />
      <SignedIn>
        <SequencesContent />
      </SignedIn>
    </>
  )
}

function SequencesContent() {
  const trpc = useTRPC()
  const { data: sequences, isLoading } = useQuery(trpc.sequences.list.queryOptions())

  if (isLoading || !sequences) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const handleAdd = () => {
    // TODO: Open create sequence modal/page
    console.log('Create sequence')
  }

  const handleSearch = () => {
    // TODO: Open search
    console.log('Search sequences')
  }

  return (
    <div className="space-y-4">
      {/* Mobile Header */}
      <MobilePageHeader
        title="Sequences"
        onAdd={handleAdd}
        onSearch={handleSearch}
      />

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sequences</h1>
          <p className="text-muted-foreground">Browse and start workouts</p>
        </div>
        <Link to="/exercises">
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Sequence
          </button>
        </Link>
      </div>

      {/* Content */}
      {sequences && sequences.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {sequences.map((seq) => (
            <div
              key={seq.id}
              className="rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:border-primary"
            >
              <div className="flex flex-col space-y-1.5 p-6 pb-3">
                <h2 className="text-lg font-semibold leading-none tracking-tight">
                  {seq.name}
                </h2>
              </div>
              <div className="p-6 pt-0 space-y-3">
                <div className="flex gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <span className="rounded-full border px-2 py-0.5">
                    {(seq.exercises as any[]).length} exercises
                  </span>
                </div>
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Start Workout
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ListOrdered}
          title="No sequences yet"
          description="Create your first workout sequence to get started with your training."
          actionLabel="+ Create Sequence"
          onAction={handleAdd}
        />
      )}
    </div>
  )
}
