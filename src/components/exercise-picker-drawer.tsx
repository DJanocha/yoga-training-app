import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/lib/trpc"
import { WheelNumberInput } from "@/components/ui/wheel-number-input"
import { WheelSelect } from "@/components/ui/wheel-select"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Plus, Search } from "lucide-react"
import type { MeasureType } from "@/db/types"

export type ExercisePickerConfig = {
  targetValue: number
  measure: MeasureType
}

type ExercisePickerDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExerciseSelected: (exerciseId: number, config: ExercisePickerConfig) => void
  title?: string
  description?: string
  initialConfig?: ExercisePickerConfig
}

export function ExercisePickerDrawer({
  open,
  onOpenChange,
  onExerciseSelected,
  title = "Add Exercise",
  description = "Select an exercise to add to your sequence",
  initialConfig = { targetValue: 30, measure: "time" },
}: ExercisePickerDrawerProps) {
  const trpc = useTRPC()

  // Configuration state
  const [targetValue, setTargetValue] = useState(initialConfig.targetValue)
  const [measure, setMeasure] = useState<MeasureType>(initialConfig.measure)

  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch all exercises
  const { data: allExercises } = useQuery(trpc.exercises.list.queryOptions())

  // Filter exercises by search query
  const filteredExercises = useMemo(() => {
    if (!allExercises) return []
    if (!searchQuery) return allExercises

    const query = searchQuery.toLowerCase()
    return allExercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(query) ||
      exercise.description?.toLowerCase().includes(query)
    )
  }, [allExercises, searchQuery])

  const handleExerciseClick = (exerciseId: number) => {
    onExerciseSelected(exerciseId, { targetValue, measure })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {/* Configuration Controls - Two Wheels Side by Side */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <WheelNumberInput
              value={targetValue}
              onChange={setTargetValue}
              min={1}
              max={999}
            />
            <span className="text-xs text-muted-foreground">Value</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <WheelSelect
              value={measure}
              onChange={setMeasure}
              options={['repetitions', 'time'] as const}
              formatOption={(opt) => opt === 'repetitions' ? 'reps' : 'sec'}
            />
            <span className="text-xs text-muted-foreground">Unit</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Exercise List */}
        <div className="mt-4 overflow-y-auto max-h-[calc(80vh-300px)]">
          {filteredExercises.length > 0 ? (
            <div className="grid gap-2">
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => handleExerciseClick(exercise.id)}
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
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? "No exercises found" : "No exercises available"}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
