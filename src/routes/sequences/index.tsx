import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTRPC } from '@/lib/trpc'
import { RedirectToSignIn, SignedIn, AuthLoading } from '@/components/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ListOrdered, Pencil, Eye, Play } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { ActionBar } from '@/components/action-bar'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppForm } from '@/hooks/form'
import { sequenceLabelOverrides, sequenceRequiredDefaults, getFieldLabel } from '@/lib/form-utils'
import { z } from 'zod'

// Simple validator for quick create form (only name field)
const quickCreateValidator = z.object({
  name: z.string().min(1, 'Name is required'),
})


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
  const navigate = useNavigate()
  const { data: sequences, isLoading } = useQuery(trpc.sequences.list.queryOptions())

  // Filter state
  const [level, setLevel] = useState<string>("")
  const [category, setCategory] = useState<string>("")

  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Selected item for copy functionality
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined)

  // Create form open state (for EmptyState to trigger)
  const [isCreateOpen, setIsCreateOpen] = useState(false)


  // Create sequence mutation
  const createSequence = useMutation(trpc.sequences.create.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.sequences.list.queryKey() })
    },
  }))

  // Duplicate sequence mutation
  const duplicateSequence = useMutation(trpc.sequences.duplicate.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.sequences.list.queryKey() })
    },
  }))

  // Quick create form using TanStack Form
  const form = useAppForm({
    defaultValues: sequenceRequiredDefaults,
    validators: {
      onSubmit: quickCreateValidator,
    },
  })

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

  // Handle quick create - creates sequence with just name
  // Note: Sequences require exercises, so this will create with empty array
  // which may fail - user should use "Add details" for full creation
  const handleQuickCreate = async () => {
    // Validate the form first
    await form.validate('submit')
    if (!form.state.isValid) return

    const name = form.state.values.name
    if (!name.trim()) return

    try {
      await createSequence.mutateAsync({
        name,
        exercises: [], // Empty - API may reject this
      })
      form.reset()
    } catch (error) {
      // If creation fails due to empty exercises, the error will be shown
      console.error('Failed to create sequence:', error)
    }
  }

  // Handle add details - for sequences, this is the preferred flow
  // since sequences require exercises
  const handleAddDetails = async () => {
    // Validate the form first
    await form.validate('submit')
    if (!form.state.isValid) return

    const name = form.state.values.name
    if (!name.trim()) return

    try {
      const newSequence = await createSequence.mutateAsync({
        name,
        exercises: [], // Empty initially
      })
      form.reset()
      if (newSequence) {
        // Navigate to sequence editor
        navigate({ to: '/sequences/$id/edit', params: { id: newSequence.id.toString() } })
      }
    } catch (error) {
      console.error('Failed to create sequence:', error)
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

  // Create content for ActionBar using TanStack Form
  const createContent = (
    <form.AppForm>
      <form.AppField name="name">
        {(field) => (
          <field.TextField
            label={getFieldLabel('name', sequenceLabelOverrides)}
            placeholder="Enter sequence name"
          />
        )}
      </form.AppField>
    </form.AppForm>
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate({ to: '/sequences/$id/execute', params: { id: String(seq.id) } })
                      }}
                      disabled={(seq.exercises as unknown[]).length === 0}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="h-4 w-4" />
                      Start
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate({ to: '/sequences/$id', params: { id: String(seq.id) } })
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate({ to: '/sequences/$id/edit', params: { id: String(seq.id) } })
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                  </div>
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
            onAction={() => setIsCreateOpen(true)}
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
          onAddDetails={handleAddDetails}
          isSubmitting={createSequence.isPending}
          isCreateOpen={isCreateOpen}
          onCreateOpenChange={setIsCreateOpen}
          selectedItemId={selectedItemId}
          onCopy={handleCopySequence}
          copyDisabledMessage="Select a sequence to clone"
        />
      </div>
    </div>
  )
}
