import { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTRPC } from '@/lib/trpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  GripVertical,
  Plus,
  Trash2,
  Settings,
  Coffee,
  ArrowLeft,
  Save,
  Eye,
  Clock,
  Repeat,
  Package2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import type { SequenceExercise, GoalType, MeasureType, ModifierEffect, ExerciseModifierAssignment } from '@/db/types'
import type { Modifier } from '@/validators/entities'

type SequenceBuilderProps = {
  sequenceId: number
}

type SequenceItemWithId = SequenceExercise & { id: string }

// Sortable item component
function SortableExerciseItem({
  item,
  exerciseName,
  modifiers,
  onConfigure,
  onRemove,
}: {
  item: SequenceItemWithId
  exerciseName: string
  modifiers?: Modifier[]
  onConfigure: () => void
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isBreak = item.exerciseId === 'break'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-card border rounded-lg ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isBreak ? (
            <>
              <Coffee className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Break</span>
            </>
          ) : (
            <span className="font-medium truncate">{exerciseName}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
          {item.config.measure === 'time' ? (
            <>
              <Clock className="h-3 w-3" />
              <span>{item.config.targetValue || 0}s</span>
            </>
          ) : (
            <>
              <Repeat className="h-3 w-3" />
              <span>{item.config.targetValue || 0} reps</span>
            </>
          )}
          <Badge variant="outline" className="text-xs">
            {item.config.goal}
          </Badge>
          {/* Show assigned modifiers */}
          {modifiers && modifiers.length > 0 && item.modifiers && item.modifiers.length > 0 && (
            <>
              {item.modifiers.map((assignment) => {
                const modifier = modifiers.find((m) => m.id === assignment.modifierId)
                if (!modifier) return null
                const effectColor = assignment.effect === 'easier' ? 'bg-green-100 text-green-800' :
                                   assignment.effect === 'harder' ? 'bg-red-100 text-red-800' :
                                   'bg-blue-100 text-blue-800'
                const displayText = [
                  modifier.name,
                  modifier.value !== null && modifier.value !== undefined ? modifier.value : null,
                  modifier.unit && modifier.unit !== 'none' ? modifier.unit : null,
                ].filter(Boolean).join(' ')
                return (
                  <Badge key={assignment.modifierId} className={`text-xs ${effectColor}`}>
                    {displayText}
                  </Badge>
                )
              })}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onConfigure}
          className="h-8 w-8"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function SequenceBuilder({ sequenceId }: SequenceBuilderProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Fetch sequence data
  const { data: sequence, isLoading: sequenceLoading } = useQuery(
    trpc.sequences.byId.queryOptions({ id: sequenceId })
  )

  // Fetch all exercises for picker
  const { data: allExercises } = useQuery(trpc.exercises.list.queryOptions())

  // Fetch all modifiers
  const { data: allModifiers } = useQuery(trpc.modifiers.list.queryOptions())

  // Update mutation
  const updateSequence = useMutation(
    trpc.sequences.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.sequences.list.queryKey() })
        queryClient.invalidateQueries({ queryKey: trpc.sequences.byId.queryKey() })
      },
    })
  )

  // Local state for editing
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [exercises, setExercises] = useState<SequenceItemWithId[]>([])
  const [availableModifiers, setAvailableModifiers] = useState<number[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // UI state
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [configureItem, setConfigureItem] = useState<SequenceItemWithId | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isModifiersExpanded, setIsModifiersExpanded] = useState(false)

  // Initialize form when sequence loads
  if (sequence && !isInitialized) {
    setName(sequence.name)
    setDescription(sequence.description || '')
    // Add unique IDs to exercises for DnD
    const exercisesWithIds = (sequence.exercises as SequenceExercise[]).map(
      (ex, index) => ({
        ...ex,
        id: `${ex.exerciseId}-${index}-${Date.now()}`,
      })
    )
    setExercises(exercisesWithIds)
    // Load available modifiers for this sequence
    setAvailableModifiers((sequence.availableModifiers as number[]) || [])
    setIsInitialized(true)
  }

  // DnD sensors with activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // activationConstraint: {
      //   distance: 8, // 8px movement required before drag starts
      // },
    }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setExercises((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }, [])

  // Add exercise
  const addExercise = useCallback((exerciseId: number) => {
    const newItem: SequenceItemWithId = {
      id: `${exerciseId}-${Date.now()}`,
      exerciseId,
      config: {
        goal: 'strict',
        measure: 'time',
        targetValue: 30,
      },
    }
    setExercises((prev) => [...prev, newItem])
    setIsPickerOpen(false)
  }, [])

  // Add break
  const addBreak = useCallback(() => {
    const newItem: SequenceItemWithId = {
      id: `break-${Date.now()}`,
      exerciseId: 'break',
      config: {
        goal: 'strict',
        measure: 'time',
        targetValue: 10,
      },
    }
    setExercises((prev) => [...prev, newItem])
  }, [])

  // Remove item
  const removeItem = useCallback((id: string) => {
    setExercises((prev) => prev.filter((item) => item.id !== id))
  }, [])

  // Update item config
  const updateItemConfig = useCallback(
    (id: string, config: Partial<SequenceItemWithId['config']>) => {
      setExercises((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, config: { ...item.config, ...config } }
            : item
        )
      )
    },
    []
  )

  // Save sequence
  const handleSave = async () => {
    if (!sequence) return

    // Strip IDs before saving
    const exercisesToSave = exercises.map(({ id: _id, ...rest }) => rest)

    await updateSequence.mutateAsync({
      id: sequenceId,
      name,
      description: description || undefined,
      exercises: exercisesToSave,
      availableModifiers,
    })

    navigate({ to: '/sequences' })
  }

  // Toggle modifier availability for the sequence
  const toggleModifier = useCallback((modifierId: number) => {
    setAvailableModifiers((prev) =>
      prev.includes(modifierId)
        ? prev.filter((id) => id !== modifierId)
        : [...prev, modifierId]
    )
  }, [])

  // Update item modifiers (per exercise)
  const updateItemModifiers = useCallback(
    (id: string, modifiers: ExerciseModifierAssignment[]) => {
      setExercises((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, modifiers }
            : item
        )
      )
    },
    []
  )

  // Get modifier by ID
  const getModifierById = useCallback((modifierId: number): Modifier | undefined => {
    return allModifiers?.find((m) => m.id === modifierId)
  }, [allModifiers])

  // Get exercise name by ID
  const getExerciseName = (exerciseId: number | 'break'): string => {
    if (exerciseId === 'break') return 'Break'
    return allExercises?.find((ex) => ex.id === exerciseId)?.name || `Exercise #${exerciseId}`
  }

  // Calculate total duration
  const totalDuration = exercises.reduce((acc, item) => {
    if (item.config.measure === 'time' && item.config.targetValue) {
      return acc + item.config.targetValue
    }
    return acc
  }, 0)

  if (sequenceLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!sequence) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Sequence not found</p>
        <Button
          onClick={() => navigate({ to: '/sequences' })}
          className="mt-4"
        >
          Back to Sequences
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: '/sequences' })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Edit Sequence</h1>
          <p className="text-sm text-muted-foreground">
            {exercises.length} exercises • {Math.floor(totalDuration / 60)}m {totalDuration % 60}s
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsPreviewOpen(true)}
        >
          <Eye className="h-5 w-5" />
        </Button>
        <Button onClick={handleSave} disabled={updateSequence.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 pb-32">
        {/* Sequence info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Sequence Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sequence name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            {/* Available Modifiers */}
            {allModifiers && allModifiers.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => setIsModifiersExpanded(!isModifiersExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <Package2 className="h-4 w-4 text-muted-foreground" />
                    <Label className="cursor-pointer">Available Modifiers</Label>
                    {availableModifiers.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {availableModifiers.length}
                      </Badge>
                    )}
                  </div>
                  {isModifiersExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isModifiersExpanded && (
                  <div className="mt-3 space-y-2 pl-6">
                    <p className="text-xs text-muted-foreground mb-2">
                      Select equipment that can be used during this sequence
                    </p>
                    {allModifiers.map((modifier) => {
                      const displayText = [
                        modifier.name,
                        modifier.value !== null && modifier.value !== undefined ? modifier.value : null,
                        modifier.unit && modifier.unit !== 'none' ? modifier.unit : null,
                      ].filter(Boolean).join(' ')
                      return (
                        <div key={modifier.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`modifier-${modifier.id}`}
                            checked={availableModifiers.includes(modifier.id)}
                            onCheckedChange={() => toggleModifier(modifier.id)}
                          />
                          <label
                            htmlFor={`modifier-${modifier.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {displayText}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exercises list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Exercises</h2>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addBreak}
              >
                <Coffee className="h-4 w-4 mr-2" />
                Add Break
              </Button>
              <Sheet open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                <SheetTrigger asChild>
                  <Button type="button" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Exercise
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh]">
                  <SheetHeader>
                    <SheetTitle>Select Exercise</SheetTitle>
                    <SheetDescription>
                      Choose an exercise to add to your sequence
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 overflow-y-auto max-h-[calc(80vh-120px)]">
                    {allExercises && allExercises.length > 0 ? (
                      <div className="grid gap-2">
                        {allExercises.map((exercise) => (
                          <button
                            key={exercise.id}
                            type="button"
                            onClick={() => addExercise(exercise.id)}
                            className="flex items-center gap-3 p-3 text-left hover:bg-muted rounded-lg transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{exercise.name}</p>
                              {exercise.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {exercise.description}
                                </p>
                              )}
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No exercises available. Create some exercises first.
                      </p>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {exercises.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={exercises.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {exercises.map((item) => (
                    <SortableExerciseItem
                      key={item.id}
                      item={item}
                      exerciseName={getExerciseName(item.exerciseId)}
                      modifiers={allModifiers}
                      onConfigure={() => setConfigureItem(item)}
                      onRemove={() => removeItem(item.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <p>No exercises yet</p>
              <p className="text-sm">Add exercises to build your sequence</p>
            </div>
          )}
        </div>
      </main>

      {/* Configure exercise sheet */}
      <Sheet open={!!configureItem} onOpenChange={(open) => !open && setConfigureItem(null)}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>
              Configure {configureItem && getExerciseName(configureItem.exerciseId)}
            </SheetTitle>
            <SheetDescription>
              Set the goal, measure, and target value for this exercise
            </SheetDescription>
          </SheetHeader>
          {configureItem && (
            <div className="mt-4 space-y-4">
              <div>
                <Label>Goal Type</Label>
                <Select
                  value={configureItem.config.goal}
                  onValueChange={(value: GoalType) =>
                    updateItemConfig(configureItem.id, { goal: value })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strict">Strict (exact target)</SelectItem>
                    <SelectItem value="elastic">Elastic (flexible)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Measure</Label>
                <Select
                  value={configureItem.config.measure}
                  onValueChange={(value: MeasureType) =>
                    updateItemConfig(configureItem.id, { measure: value })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Time (seconds)</SelectItem>
                    <SelectItem value="repetitions">Repetitions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Target Value ({configureItem.config.measure === 'time' ? 'seconds' : 'reps'})
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={configureItem.config.targetValue || ''}
                  onChange={(e) =>
                    updateItemConfig(configureItem.id, {
                      targetValue: parseInt(e.target.value) || undefined,
                    })
                  }
                  className="mt-1.5"
                />
              </div>

              {/* Modifier assignment (only for non-break exercises and if sequence has modifiers) */}
              {configureItem.exerciseId !== 'break' && availableModifiers.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package2 className="h-4 w-4 text-muted-foreground" />
                    <Label>Assign Modifiers</Label>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Add equipment/modifiers and specify their effect
                  </p>
                  <div className="space-y-3">
                    {availableModifiers.map((modifierId) => {
                      const modifier = getModifierById(modifierId)
                      if (!modifier) return null

                      const currentAssignment = configureItem.modifiers?.find(
                        (m) => m.modifierId === modifierId
                      )
                      const isAssigned = !!currentAssignment
                      const displayText = [
                        modifier.name,
                        modifier.value !== null && modifier.value !== undefined ? modifier.value : null,
                        modifier.unit && modifier.unit !== 'none' ? modifier.unit : null,
                      ].filter(Boolean).join(' ')

                      return (
                        <div key={modifierId} className="flex items-center gap-3 p-2 border rounded-lg">
                          <Checkbox
                            id={`assign-${modifierId}`}
                            checked={isAssigned}
                            onCheckedChange={(checked) => {
                              const currentModifiers = configureItem.modifiers || []
                              if (checked) {
                                // Add modifier with default effect
                                updateItemModifiers(configureItem.id, [
                                  ...currentModifiers,
                                  { modifierId, effect: 'neutral' as ModifierEffect },
                                ])
                              } else {
                                // Remove modifier
                                updateItemModifiers(
                                  configureItem.id,
                                  currentModifiers.filter((m) => m.modifierId !== modifierId)
                                )
                              }
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`assign-${modifierId}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {displayText}
                            </label>
                          </div>
                          {isAssigned && (
                            <Select
                              value={currentAssignment.effect}
                              onValueChange={(value: ModifierEffect) => {
                                const currentModifiers = configureItem.modifiers || []
                                updateItemModifiers(
                                  configureItem.id,
                                  currentModifiers.map((m) =>
                                    m.modifierId === modifierId
                                      ? { ...m, effect: value }
                                      : m
                                  )
                                )
                              }}
                            >
                              <SelectTrigger className="w-[100px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="easier">Easier</SelectItem>
                                <SelectItem value="neutral">Neutral</SelectItem>
                                <SelectItem value="harder">Harder</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => setConfigureItem(null)}
              >
                Done
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Preview sheet */}
      <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Sequence Preview</SheetTitle>
            <SheetDescription>
              Review your sequence before saving
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-semibold">{name || 'Untitled'}</h3>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{exercises.length} exercises</span>
              <span>•</span>
              <span>{Math.floor(totalDuration / 60)}m {totalDuration % 60}s</span>
            </div>

            <div className="space-y-2">
              {exercises.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 bg-muted/50 rounded"
                >
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {getExerciseName(item.exerciseId)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.config.measure === 'time'
                        ? `${item.config.targetValue}s`
                        : `${item.config.targetValue} reps`}
                      {' • '}
                      {item.config.goal}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
