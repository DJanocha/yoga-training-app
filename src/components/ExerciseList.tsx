import { useState } from 'react'
import { z } from 'zod'
import { ExerciseForm } from './ExerciseForm'
import { Dumbbell } from 'lucide-react'
import { useTRPC } from '@/lib/trpc'
import type { Level, Category, BodyPart } from '@/db/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { EmptyState } from '@/components/empty-state'
import { ActionBar } from '@/components/action-bar'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppForm } from '@/hooks/form'
import { exerciseLabelOverrides, exerciseRequiredDefaults, getFieldLabel } from '@/lib/form-utils'

// Required fields schema for quick create
const exerciseRequiredSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
})

export function ExerciseList() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Filter state
  const [level, setLevel] = useState<string>("")
  const [category, setCategory] = useState<string>("")
  const [bodyPart, setBodyPart] = useState<string>("")

  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Selected item for copy functionality
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined)

  // UI state
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set())

  // Create exercise mutation
  const createExercise = useMutation(trpc.exercises.create.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.exercises.filteredList.queryKey() })
      queryClient.invalidateQueries({ queryKey: trpc.exercises.list.queryKey() })
    },
  }))

  // Quick create form using TanStack Form
  const form = useAppForm({
    defaultValues: exerciseRequiredDefaults,
    validators: {
      onSubmit: exerciseRequiredSchema,
    },
  })


  const { data: exercises, isLoading } = useQuery(trpc.exercises.filteredList.queryOptions({
    level: level ? (level as Level) : undefined,
    category: category ? (category as Category) : undefined,
    bodyPart: bodyPart ? (bodyPart as BodyPart) : undefined,
  }))

  const softDelete = useMutation(trpc.exercises.delete.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.exercises.filteredList.queryKey() })
      queryClient.invalidateQueries({ queryKey: trpc.exercises.list.queryKey() })
    },
  }))

  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const toggleDescription = (id: number) => {
    const newExpanded = new Set(expandedDescriptions)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedDescriptions(newExpanded)
  }

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'yoga':
        return 'bg-purple-100 text-purple-800'
      case 'calisthenics':
        return 'bg-blue-100 text-blue-800'
      case 'cardio':
        return 'bg-orange-100 text-orange-800'
      case 'flexibility':
        return 'bg-pink-100 text-pink-800'
      case 'strength':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading || !exercises) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (showForm || editingId) {
    return (
      <ExerciseForm
        exerciseId={editingId}
        onClose={() => {
          setShowForm(false)
          setEditingId(null)
        }}
      />
    )
  }

  // Calculate active filter count
  const filterCount = [level, category, bodyPart].filter(Boolean).length

  // Handle copy/duplicate exercise
  const handleCopyExercise = (itemId: string) => {
    // TODO: Implement exercise duplication
    console.log('Copy exercise:', itemId)
  }

  // Handle quick create - creates exercise with just name
  const handleQuickCreate = async () => {
    // Validate the form first
    await form.validate('submit')
    if (!form.state.isValid) return

    const name = form.state.values.name
    if (!name.trim()) return

    await createExercise.mutateAsync({
      name,
      photoUrls: [],
      videoUrls: [],
      links: [],
    })
    form.reset()
  }

  // Handle add details - creates exercise then navigates to edit page
  const handleAddDetails = async () => {
    // Validate the form first
    await form.validate('submit')
    if (!form.state.isValid) return

    const name = form.state.values.name
    if (!name.trim()) return

    const newExercise = await createExercise.mutateAsync({
      name,
      photoUrls: [],
      videoUrls: [],
      links: [],
    })
    form.reset()
    if (newExercise) {
      // Navigate to edit page - for now, use the existing full form
      setEditingId(newExercise.id)
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
            <SelectItem value="calisthenics">Calisthenics</SelectItem>
            <SelectItem value="cardio">Cardio</SelectItem>
            <SelectItem value="flexibility">Flexibility</SelectItem>
            <SelectItem value="strength">Strength</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-sm font-medium">Body Part</Label>
        <Select value={bodyPart} onValueChange={setBodyPart}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="All body parts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All body parts</SelectItem>
            <SelectItem value="arms">Arms</SelectItem>
            <SelectItem value="legs">Legs</SelectItem>
            <SelectItem value="core">Core</SelectItem>
            <SelectItem value="back">Back</SelectItem>
            <SelectItem value="chest">Chest</SelectItem>
            <SelectItem value="shoulders">Shoulders</SelectItem>
            <SelectItem value="full-body">Full Body</SelectItem>
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
            label={getFieldLabel('name', exerciseLabelOverrides)}
            placeholder="Enter exercise name"
          />
        )}
      </form.AppField>
    </form.AppForm>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border md:hidden">
        <h1 className="text-2xl font-bold">Exercises</h1>
      </header>

      {/* Desktop Header */}
      <div className="hidden md:block mb-6 p-4">
        <h1 className="text-3xl font-bold">Exercises</h1>
        <p className="text-muted-foreground">Manage your exercise library</p>
      </div>

      {/* Main content - scrollable */}
      <main className="flex-1 overflow-y-auto p-4 pb-32 md:pb-4">

      {exercises.length === 0 ? (
        level || category || bodyPart ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No exercises match your filters.</p>
          </div>
        ) : (
          <EmptyState
            icon={Dumbbell}
            title="No exercises yet"
            description="Create your first exercise to start building your workout library."
            actionLabel="+ Create Exercise"
            onAction={() => setShowForm(true)}
          />
        )
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              onClick={() => setSelectedItemId(
                selectedItemId === String(exercise.id) ? undefined : String(exercise.id)
              )}
              className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-colors ${
                selectedItemId === String(exercise.id)
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                {exercise.photoUrls && exercise.photoUrls.length > 0 && (
                  <img
                    src={exercise.photoUrls[0]}
                    alt={exercise.name}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {exercise.name}
                    </h3>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {exercise.level && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(exercise.level)}`}>
                        {exercise.level}
                      </span>
                    )}
                    {exercise.category && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(exercise.category)}`}>
                        {exercise.category}
                      </span>
                    )}
                  </div>

                  {/* Body Parts */}
                  {exercise.bodyParts && exercise.bodyParts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {exercise.bodyParts.map((part) => (
                        <span
                          key={part}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded capitalize"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description Toggle */}
                  {exercise.description && (
                    <div className="mt-2">
                      {expandedDescriptions.has(exercise.id) ? (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">{exercise.description}</p>
                          {exercise.tips && (
                            <p className="text-sm text-gray-600 italic">Tips: {exercise.tips}</p>
                          )}
                          <button
                            onClick={() => toggleDescription(exercise.id)}
                            className="text-sm text-blue-600 hover:underline mt-1"
                          >
                            Show less
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleDescription(exercise.id)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Show description
                        </button>
                      )}
                    </div>
                  )}

                  {exercise.links.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {exercise.links.map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-blue-600 hover:underline truncate"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setEditingId(exercise.id)}
                  className="flex-1 min-h-[44px] px-4 py-2 bg-gray-100 text-gray-700 text-base font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this exercise?')) {
                      softDelete.mutate({ id: exercise.id })
                    }
                  }}
                  className="flex-1 min-h-[44px] px-4 py-2 bg-red-50 text-red-600 text-base font-medium rounded-lg hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </main>

      {/* Action Bar - fixed at bottom on mobile */}
      <div className="fixed bottom-14 left-0 right-0 z-40 md:static md:mt-4">
        <ActionBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search exercises..."
          filterCount={filterCount}
          filterContent={filterContent}
          onApplyFilters={() => {
            // Filters are already reactive via state
          }}
          onClearFilters={() => {
            setLevel("")
            setCategory("")
            setBodyPart("")
          }}
          createContent={createContent}
          onSubmitCreate={handleQuickCreate}
          onAddDetails={handleAddDetails}
          isSubmitting={createExercise.isPending}
          selectedItemId={selectedItemId}
          onCopy={handleCopyExercise}
          copyDisabledMessage="Select an exercise to duplicate"
        />
      </div>
    </div>
  )
}
