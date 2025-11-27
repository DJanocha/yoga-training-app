"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Coffee, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { WheelNumberInput } from "@/components/ui/wheel-number-input"
import { WheelSelect } from "@/components/ui/wheel-select"
import type { MeasureType } from "@/db/types"

export type ExerciseItem = {
  id: number
  name: string
  description?: string | null
}

export type AddExerciseConfig = {
  targetValue: number
  measure: MeasureType
}

type AddExerciseContentProps = {
  exercises: ExerciseItem[]
  onExerciseAdd?: (exerciseId: number, config: AddExerciseConfig) => void
  onBreakAdd?: (config: AddExerciseConfig) => void
  showBreakOption: boolean
  defaultConfig: AddExerciseConfig
  onClose: () => void
}

export function AddExerciseContent({
  exercises,
  onExerciseAdd,
  onBreakAdd,
  showBreakOption,
  defaultConfig,
  onClose,
}: AddExerciseContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [targetValue, setTargetValue] = useState(defaultConfig.targetValue)
  const [measure, setMeasure] = useState<MeasureType>(defaultConfig.measure)

  // Reset state when mounted
  useEffect(() => {
    setSearchQuery("")
    setTargetValue(defaultConfig.targetValue)
    setMeasure(defaultConfig.measure)
  }, [defaultConfig.targetValue, defaultConfig.measure])

  // Filter exercises by search
  const filteredExercises = useMemo(() => {
    if (!searchQuery) return exercises
    const query = searchQuery.toLowerCase()
    return exercises.filter((ex) =>
      ex.name.toLowerCase().includes(query) ||
      ex.description?.toLowerCase().includes(query)
    )
  }, [exercises, searchQuery])

  const handleExerciseClick = (exerciseId: number) => {
    if (onExerciseAdd) {
      onExerciseAdd(exerciseId, { targetValue, measure })
      onClose()
    }
  }

  const handleBreakClick = () => {
    if (onBreakAdd) {
      onBreakAdd({ targetValue: 10, measure: "time" })
      onClose()
    }
  }

  return (
    <>
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-base h-10"
          />
        </div>
      </div>

      {/* Wheels for config */}
      <div className="flex items-center justify-center gap-4 p-3 border-b bg-muted/30">
        <div className="flex flex-col items-center gap-1">
          <WheelNumberInput
            value={targetValue}
            onChange={setTargetValue}
            min={1}
            max={999}
            size="default"
          />
          <span className="text-xs text-muted-foreground">Value</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <WheelSelect
            value={measure}
            onChange={setMeasure}
            options={["repetitions", "time"] as const}
            formatOption={(opt) => (opt === "repetitions" ? "reps" : "sec")}
            size="default"
          />
          <span className="text-xs text-muted-foreground">Unit</span>
        </div>
      </div>

      {/* Exercise List */}
      <div className="max-h-[240px] overflow-y-auto">
        {/* Break option */}
        {showBreakOption && onBreakAdd && !searchQuery && (
          <button
            type="button"
            onClick={handleBreakClick}
            className="w-full flex items-center gap-3 p-3 text-left bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors border-b border-blue-200 dark:border-blue-900"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Coffee className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-blue-900 dark:text-blue-100">Break</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">10s rest</p>
            </div>
            <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          </button>
        )}

        {/* Exercises */}
        {filteredExercises.length > 0 ? (
          filteredExercises.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              onClick={() => handleExerciseClick(exercise.id)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-b-0"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{exercise.name}</p>
                {exercise.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {exercise.description}
                  </p>
                )}
              </div>
              <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))
        ) : (
          <div className="p-6 text-center text-muted-foreground text-sm">
            {searchQuery ? "No exercises found" : "No exercises available"}
          </div>
        )}
      </div>
    </>
  )
}
