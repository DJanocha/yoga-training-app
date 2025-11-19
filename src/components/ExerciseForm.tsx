import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useTRPC } from '@/lib/trpc'
import type { Level, Category, BodyPart } from '@/db/types'

interface ExerciseFormProps {
  exerciseId: number | null
  onClose: () => void
}

export function ExerciseForm({ exerciseId, onClose }: ExerciseFormProps) {
  const utils = useTRPC.useUtils()

  const { data: exercise, isLoading } = useTRPC.exercises.byId.useQuery(
    { id: exerciseId! },
    { enabled: exerciseId !== null },
  )

  const create = useTRPC.exercises.create.useMutation({
    onSuccess: () => {
      utils.exercises.list.invalidate()
      utils.exercises.filteredList.invalidate()
    },
  })

  const update = useTRPC.exercises.update.useMutation({
    onSuccess: () => {
      utils.exercises.list.invalidate()
      utils.exercises.filteredList.invalidate()
      utils.exercises.byId.invalidate()
    },
  })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tips, setTips] = useState('')
  const [modifications, setModifications] = useState<string[]>([])
  const [modificationInput, setModificationInput] = useState('')
  const [level, setLevel] = useState<Level | undefined>()
  const [category, setCategory] = useState<Category | undefined>()
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([])
  const [links, setLinks] = useState<string[]>([])
  const [linkInput, setLinkInput] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [photoUrlInput, setPhotoUrlInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (exercise) {
      setName(exercise.name)
      setDescription(exercise.description || '')
      setTips(exercise.tips || '')
      setModifications(exercise.modifications || [])
      setLevel((exercise.level as Level) || undefined)
      setCategory((exercise.category as Category) || undefined)
      setBodyParts((exercise.bodyParts as BodyPart[]) || [])
      setLinks(exercise.links)
      setPhotoUrls(exercise.photoUrls || [])
    }
  }, [exercise])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Exercise name is required')
      return
    }

    setError(null)
    try {
      const exerciseData = {
        name: name.trim(),
        description: description.trim() || undefined,
        tips: tips.trim() || undefined,
        modifications: modifications.length > 0 ? modifications : undefined,
        level,
        category,
        bodyParts: bodyParts.length > 0 ? bodyParts : undefined,
        links,
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      }

      if (exerciseId) {
        update.mutate({
          id: exerciseId,
          ...exerciseData,
        })
      } else {
        create.mutate(exerciseData)
      }
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save exercise',
      )
    }
  }

  if (exerciseId && isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {exerciseId ? 'Edit Exercise' : 'New Exercise'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Exercise name"
              required
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe the exercise..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Tips
            </label>
            <textarea
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Tips for proper form..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Level
            </label>
            <select
              value={level || ''}
              onChange={(e) => setLevel((e.target.value as any) || undefined)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select level...</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category || ''}
              onChange={(e) =>
                setCategory((e.target.value as any) || undefined)
              }
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select category...</option>
              <option value="yoga">Yoga</option>
              <option value="calisthenics">Calisthenics</option>
              <option value="cardio">Cardio</option>
              <option value="flexibility">Flexibility</option>
              <option value="strength">Strength</option>
            </select>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Body Parts
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  'arms',
                  'legs',
                  'core',
                  'back',
                  'chest',
                  'shoulders',
                  'full-body',
                ] as const
              ).map((part) => (
                <label
                  key={part}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={bodyParts.includes(part)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBodyParts([...bodyParts, part])
                      } else {
                        setBodyParts(bodyParts.filter((p) => p !== part))
                      }
                    }}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-sm capitalize">{part}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Modifications
            </label>
            <div className="space-y-2">
              {modifications.map((mod, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={mod}
                    readOnly
                    className="flex-1 px-4 py-2 text-base border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setModifications(
                        modifications.filter((_, idx) => idx !== i),
                      )
                    }
                    className="min-h-[44px] min-w-[44px] px-4 bg-red-50 text-red-600 text-base font-medium rounded-lg hover:bg-red-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={modificationInput}
                  onChange={(e) => setModificationInput(e.target.value)}
                  className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a modification..."
                />
                <button
                  type="button"
                  onClick={() => {
                    if (modificationInput.trim()) {
                      setModifications([
                        ...modifications,
                        modificationInput.trim(),
                      ])
                      setModificationInput('')
                    }
                  }}
                  className="min-h-[44px] px-6 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Photo URLs
            </label>
            <div className="space-y-2">
              {photoUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    readOnly
                    className="flex-1 px-4 py-2 text-base border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoUrls(photoUrls.filter((_, idx) => idx !== i))
                    }
                    className="min-h-[44px] min-w-[44px] px-4 bg-red-50 text-red-600 text-base font-medium rounded-lg hover:bg-red-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={() => {
                    if (photoUrlInput.trim()) {
                      setPhotoUrls([...photoUrls, photoUrlInput.trim()])
                      setPhotoUrlInput('')
                    }
                  }}
                  className="min-h-[44px] px-6 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Links
            </label>
            <div className="space-y-2">
              {links.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={link}
                    readOnly
                    className="flex-1 px-4 py-2 text-base border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setLinks(links.filter((_, idx) => idx !== i))
                    }
                    className="min-h-[44px] min-w-[44px] px-4 bg-red-50 text-red-600 text-base font-medium rounded-lg hover:bg-red-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={() => {
                    if (linkInput.trim()) {
                      setLinks([...links, linkInput.trim()])
                      setLinkInput('')
                    }
                  }}
                  className="min-h-[44px] px-6 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] px-6 py-3 bg-gray-100 text-gray-700 text-base font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
