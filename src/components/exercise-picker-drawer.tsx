import { useState, useMemo, useEffect } from "react"
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
import { Plus, Search, Coffee } from "lucide-react"
import type { MeasureType } from "@/db/types"

export type InsertPosition = "before" | "after"

export type ExercisePickerConfig = {
  targetValue: number
  measure: MeasureType
  position?: InsertPosition
}

type ExercisePickerDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExerciseSelected: (exerciseId: number, config: ExercisePickerConfig) => void
  onBreakSelected?: (config: ExercisePickerConfig) => void
  showBreakOption?: boolean
  /** Show position wheel for choosing insert position (before/after current exercise) */
  showPositionOption?: boolean
  title?: string
  description?: string
  initialConfig?: ExercisePickerConfig
}

export function ExercisePickerDrawer({
  open,
  onOpenChange,
  onExerciseSelected,
  onBreakSelected,
  showBreakOption = true,
  showPositionOption = false,
  title = "Add Exercise",
  description = "Select an exercise to add to your sequence",
  initialConfig = { targetValue: 30, measure: "time", position: "after" },
}: ExercisePickerDrawerProps) {
  const trpc = useTRPC()

  // Configuration state
  const [targetValue, setTargetValue] = useState(initialConfig.targetValue)
  const [measure, setMeasure] = useState<MeasureType>(initialConfig.measure)
  const [position, setPosition] = useState<InsertPosition>(initialConfig.position ?? "after")

  // Sync state when drawer opens or initialConfig changes
  useEffect(() => {
    if (open) {
      setTargetValue(initialConfig.targetValue)
      setMeasure(initialConfig.measure)
      setPosition(initialConfig.position ?? "after")
      setSearchQuery("")
    }
  }, [open, initialConfig.targetValue, initialConfig.measure, initialConfig.position])

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
    onExerciseSelected(exerciseId, { targetValue, measure, position: showPositionOption ? position : undefined })
    onOpenChange(false)
  }

  const handleBreakClick = () => {
    if (onBreakSelected) {
      // Breaks always use time-based config, default 10s
      onBreakSelected({ targetValue: 10, measure: "time", position: showPositionOption ? position : undefined })
      onOpenChange(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {/* Configuration Controls - Wheels Side by Side */}
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

          {/* Position wheel - only shown during execution */}
          {showPositionOption && (
            <div className="flex flex-col items-center gap-2">
              <WheelSelect
                value={position}
                onChange={setPosition}
                options={['before', 'after'] as const}
                formatOption={(opt) => opt}
              />
              <span className="text-xs text-muted-foreground">Position</span>
            </div>
          )}
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
          <div className="grid gap-2">
            {/* Break option at the top */}
            {showBreakOption && onBreakSelected && !searchQuery && (
              <button
                type="button"
                onClick={handleBreakClick}
                className="flex items-center gap-3 p-3 text-left bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-900"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Coffee className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">Break</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Rest period (10s default)
                  </p>
                </div>
                <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </button>
            )}

            {/* Exercises */}
            {filteredExercises.length > 0 ? (
              filteredExercises.map((exercise) => (
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
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? "No exercises found" : "No exercises available"}
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
