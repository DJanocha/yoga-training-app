import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTRPC } from '@/lib/trpc'
import { RedirectToSignIn, SignedIn, AuthLoading } from 'better-auth-ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ListOrdered } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { ActionBar } from '@/components/action-bar'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

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
  const queryClient = useQueryClient()
  const { data: sequences, isLoading } = useQuery(trpc.sequences.list.queryOptions())

  // Filter state
  const [level, setLevel] = useState<string>("")
  const [category, setCategory] = useState<string>("")

  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Selected item for copy functionality
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined)

  // Create form state
  const [newSequenceName, setNewSequenceName] = useState("")

  // Duplicate sequence mutation
  const duplicateSequence = useMutation(trpc.sequences.duplicate.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.sequences.list.queryKey() })
    },
  }))

  if (isLoading || !sequences) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Calculate active filter count
  const filterCount = [level, category].filter(Boolean).length

  // Handle copy/duplicate sequence
  const handleCopySequence = (itemId: string) => {
    duplicateSequence.mutate({ id: parseInt(itemId) })
  }

  // Handle create sequence
  const handleQuickCreate = () => {
    if (newSequenceName.trim()) {
      // TODO: Implement quick create mutation
      console.log('Create sequence:', newSequenceName)
      setNewSequenceName("")
    }
  }

  // Filter content for ActionBar
  const filterContent = (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Level</Label>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="All levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-sm font-medium">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="yoga">Yoga</SelectItem>
            <SelectItem value="strength">Strength</SelectItem>
            <SelectItem value="cardio">Cardio</SelectItem>
            <SelectItem value="flexibility">Flexibility</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  // Create content for ActionBar
  const createContent = (
    <div>
      <Label htmlFor="quick-name" className="text-sm font-medium">
        Sequence Name
      </Label>
      <Input
        id="quick-name"
        placeholder="Enter sequence name"
        value={newSequenceName}
        onChange={(e) => setNewSequenceName(e.target.value)}
        className="mt-1.5"
        autoFocus
      />
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border md:hidden">
        <h1 className="text-2xl font-bold">Sequences</h1>
      </header>

      {/* Desktop Header */}
      <div className="hidden md:block mb-6 p-4">
        <h1 className="text-3xl font-bold">Sequences</h1>
        <p className="text-muted-foreground">Browse and start workouts</p>
      </div>

      {/* Main content - scrollable */}
      <main className="flex-1 overflow-y-auto p-4 pb-32 md:pb-4">
        {sequences && sequences.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {sequences.map((seq) => (
              <div
                key={seq.id}
                onClick={() => setSelectedItemId(
                  selectedItemId === String(seq.id) ? undefined : String(seq.id)
                )}
                className={`rounded-lg border bg-card text-card-foreground shadow-sm transition-colors cursor-pointer ${
                  selectedItemId === String(seq.id)
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'hover:border-primary'
                }`}
              >
                <div className="flex flex-col space-y-1.5 p-6 pb-3">
                  <h2 className="text-lg font-semibold leading-none tracking-tight">
                    {seq.name}
                  </h2>
                </div>
                <div className="p-6 pt-0 space-y-3">
                  <div className="flex gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <span className="rounded-full border px-2 py-0.5">
                      {(seq.exercises as unknown[]).length} exercises
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Start workout
                    }}
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
            onAction={handleQuickCreate}
          />
        )}
      </main>

      {/* Action Bar - fixed at bottom on mobile */}
      <div className="fixed bottom-14 left-0 right-0 z-40 md:static md:mt-4">
        <ActionBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search sequences..."
          filterCount={filterCount}
          filterContent={filterContent}
          onApplyFilters={() => {
            // Filters are already reactive via state
          }}
          onClearFilters={() => {
            setLevel("")
            setCategory("")
          }}
          createContent={createContent}
          onSubmitCreate={handleQuickCreate}
          selectedItemId={selectedItemId}
          onCopy={handleCopySequence}
          copyDisabledMessage="Select a sequence to clone"
        />
      </div>
    </div>
  )
}
