import { useState } from 'react'
import { ExerciseForm } from './ExerciseForm'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { trpc } from '~/lib/trpc'
import type { Level, Category, BodyPart } from '~/db/types'

export function ExerciseList() {
  const [level, setLevel] = useState<string>("")
  const [category, setCategory] = useState<string>("")
  const [bodyPart, setBodyPart] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set())

  const utils = trpc.useUtils()

  const { data: exercises, isLoading } = trpc.exercises.filteredList.useQuery({
    level: level ? (level as Level) : undefined,
    category: category ? (category as Category) : undefined,
    bodyPart: bodyPart ? (bodyPart as BodyPart) : undefined,
  })

  const softDelete = trpc.exercises.delete.useMutation({
    onSuccess: () => {
      utils.exercises.filteredList.invalidate()
      utils.exercises.list.invalidate()
    },
  })

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

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="mb-6 space-y-4">
        <button
          onClick={() => setShowForm(true)}
          className="w-full min-h-[44px] px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          + Add Exercise
        </button>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full min-h-[44px] px-6 py-3 bg-gray-100 text-gray-700 text-base font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          {showFilters ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="yoga">Yoga</option>
                <option value="calisthenics">Calisthenics</option>
                <option value="cardio">Cardio</option>
                <option value="flexibility">Flexibility</option>
                <option value="strength">Strength</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Body Part
              </label>
              <select
                value={bodyPart}
                onChange={(e) => setBodyPart(e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Body Parts</option>
                <option value="arms">Arms</option>
                <option value="legs">Legs</option>
                <option value="core">Core</option>
                <option value="back">Back</option>
                <option value="chest">Chest</option>
                <option value="shoulders">Shoulders</option>
                <option value="full-body">Full Body</option>
              </select>
            </div>

            {(level || category || bodyPart) && (
              <button
                onClick={() => {
                  setLevel("")
                  setCategory("")
                  setBodyPart("")
                }}
                className="w-full min-h-[44px] px-4 py-2 bg-gray-100 text-gray-700 text-base font-medium rounded-lg hover:bg-gray-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {exercises.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">
            {level || category || bodyPart
              ? 'No exercises match your filters.'
              : 'No exercises yet. Create your first one!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
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
    </div>
  )
}
