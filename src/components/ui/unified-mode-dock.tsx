"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Square,
  CheckSquare,
  Plus,
  HelpCircle,
  Link,
  Copy,
  Settings,
  Trash2,
  X,
  Search,
  Coffee,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { WheelNumberInput } from "@/components/ui/wheel-number-input"
import { WheelSelect } from "@/components/ui/wheel-select"
import { Dock, type DockPrimaryAction } from "./dock"
import { Backpack, type BackpackItem, type ActiveItem } from "@/components/ui/backpack"
import type { MeasureType, ModifierEffect } from "@/db/types"

// Mode types for the dock
export type DockMode = "select" | "add" | "help" | "configure" | null

// Exercise item type for the picker
export type ExerciseItem = {
  id: number
  name: string
  description?: string | null
}

// Modifier item for batch configure
export type ModifierItem = {
  id: number
  name: string
  value?: number | null
  unit?: string | null
}

// Modifier assignment in batch config
export type ModifierAssignment = {
  modifierId: number
  effect: ModifierEffect
}

// Add exercise callback config
export type AddExerciseConfig = {
  targetValue: number
  measure: MeasureType
}

// Batch configure callback config
export type BatchConfigValues = {
  measure: MeasureType
  targetValue: number
  modifiers: ModifierAssignment[]
}

export type UnifiedModeDockProps = {
  // Mode state
  activeMode: DockMode
  onModeChange: (mode: DockMode) => void

  // Selection mode props
  selectedCount: number
  onMerge?: () => void
  onClone?: () => void
  onDelete?: () => void
  canMerge?: boolean

  // Batch configure props (replaces onConfigure callback)
  availableModifiers?: ModifierItem[]
  onBatchConfigure?: (config: BatchConfigValues) => void

  // Add mode props
  exercises?: ExerciseItem[]
  onExerciseAdd?: (exerciseId: number, config: AddExerciseConfig) => void
  onBreakAdd?: (config: AddExerciseConfig) => void
  showBreakOption?: boolean
  defaultConfig?: AddExerciseConfig

  // Help mode content
  helpContent?: {
    title: string
    description: string
    tips?: string[]
  }

  // Config
  className?: string
  enableAnimations?: boolean
}

// ============================================================================
// Content Components (rendered in dock's content area)
// ============================================================================

type AddContentProps = {
  exercises: ExerciseItem[]
  onExerciseAdd?: (exerciseId: number, config: AddExerciseConfig) => void
  onBreakAdd?: (config: AddExerciseConfig) => void
  showBreakOption: boolean
  defaultConfig: AddExerciseConfig
  onClose: () => void
}

function AddContent({
  exercises,
  onExerciseAdd,
  onBreakAdd,
  showBreakOption,
  defaultConfig,
  onClose,
}: AddContentProps) {
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

type ConfigureContentProps = {
  selectedCount: number
  modifiers: ModifierItem[]
  onApply: (config: BatchConfigValues) => void
  onClose: () => void
}

function ConfigureContent({
  selectedCount,
  modifiers,
  onApply,
  onClose,
}: ConfigureContentProps) {
  const [measure, setMeasure] = useState<MeasureType>("time")
  const [targetValue, setTargetValue] = useState(30)
  const [activeModifiers, setActiveModifiers] = useState<ActiveItem[]>([])

  // Reset state when mounted
  useEffect(() => {
    setMeasure("time")
    setTargetValue(30)
    setActiveModifiers([])
  }, [])

  const handleApply = () => {
    // Convert BackpackEffect to ModifierEffect
    const modifierAssignments: ModifierAssignment[] = activeModifiers
      .filter((a) => a.effect !== null)
      .map((a) => ({
        modifierId: a.id as number,
        effect: a.effect as ModifierEffect,
      }))

    onApply({ measure, targetValue, modifiers: modifierAssignments })
    onClose()
  }

  // Convert ModifierItem[] to BackpackItem[]
  const backpackItems: BackpackItem[] = modifiers.map((m) => {
    const displayName = [
      m.name,
      m.value !== null && m.value !== undefined ? m.value : null,
      m.unit && m.unit !== "none" ? m.unit : null,
    ]
      .filter(Boolean)
      .join(" ")

    return {
      id: m.id,
      name: displayName,
    }
  })

  return (
    <>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b">
        <p className="font-medium text-sm">
          Configure {selectedCount} exercise{selectedCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Wheels for measure & target */}
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

      {/* Modifiers section using Backpack component */}
      {modifiers.length > 0 && (
        <div className="p-3 border-b">
          <Backpack.Root
            items={backpackItems}
            value={activeModifiers}
            onChange={setActiveModifiers}
            cols={3}
            rows={1}
            editable
          >
            <Backpack.Label>Mods</Backpack.Label>
            <Backpack.Container theme="dark">
              <Backpack.Grid>
                {backpackItems.map((item) => (
                  <Backpack.Slot key={item.id} item={item} size="sm">
                    <Backpack.ItemContent item={item} />
                  </Backpack.Slot>
                ))}
              </Backpack.Grid>
            </Backpack.Container>
          </Backpack.Root>
        </div>
      )}

      {/* Apply button */}
      <div className="p-3">
        <button
          type="button"
          onClick={handleApply}
          disabled={selectedCount === 0}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Apply to {selectedCount} Selected
        </button>
      </div>
    </>
  )
}

type HelpContentProps = {
  helpContent: {
    title: string
    description: string
    tips?: string[]
  }
}

function HelpContent({ helpContent }: HelpContentProps) {
  return (
    <div className="p-4">
      <h3 className="font-semibold text-sm mb-2">{helpContent.title}</h3>
      <p className="text-sm text-muted-foreground mb-3">{helpContent.description}</p>
      {helpContent.tips && helpContent.tips.length > 0 && (
        <ul className="space-y-1.5">
          {helpContent.tips.map((tip, index) => (
            <li key={index} className="text-xs text-muted-foreground flex gap-2">
              <span className="text-primary">•</span>
              {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function UnifiedModeDock({
  activeMode,
  onModeChange,
  selectedCount,
  onMerge,
  onClone,
  onDelete,
  canMerge = false,
  availableModifiers = [],
  onBatchConfigure,
  exercises = [],
  onExerciseAdd,
  onBreakAdd,
  showBreakOption = true,
  defaultConfig = { targetValue: 30, measure: "time" },
  helpContent,
  className,
  enableAnimations = true,
}: UnifiedModeDockProps) {
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && activeMode !== null) {
        onModeChange(null)
      }
      if (event.key === "Delete" && activeMode === "select" && selectedCount > 0 && onDelete) {
        onDelete()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [activeMode, selectedCount, onDelete, onModeChange])

  const handleClose = useCallback(() => {
    onModeChange(null)
  }, [onModeChange])

  // Build actions
  const actions = useMemo((): DockPrimaryAction[] => {
    // Whether actions should be disabled (no selection)
    const noSelection = selectedCount === 0

    // Build selection secondary actions - always show but disable when no selection
    // Configure is a secondary action that opens content
    const selectionSecondaryActions = [
      onMerge && {
        id: "merge",
        icon: Link,
        onClick: onMerge,
        disabled: noSelection || !canMerge,
      },
      onClone && {
        id: "clone",
        icon: Copy,
        onClick: onClone,
        disabled: noSelection,
      },
      onBatchConfigure && {
        id: "configure",
        icon: Settings,
        disabled: noSelection,
        onClick: () => onModeChange("configure"),
      },
      onDelete && {
        id: "delete",
        icon: Trash2,
        onClick: onDelete,
        bgClassName: noSelection ? undefined : "bg-muted hover:bg-destructive/10 hover:text-destructive",
        disabled: noSelection,
      },
    ].filter(Boolean) as DockPrimaryAction["secondaryActions"]

    return [
      {
        id: "select",
        icon: activeMode === "select" || activeMode === "configure" ? CheckSquare : Square,
        badge: selectedCount > 0 ? selectedCount : undefined,
        bgClassName: activeMode === "select" || activeMode === "configure" ? "bg-primary text-primary-foreground hover:bg-primary/90" : undefined,
        secondaryActions: selectionSecondaryActions,
        // Configure content - only shown when in configure mode
        content: activeMode === "configure" && onBatchConfigure ? (
          <ConfigureContent
            selectedCount={selectedCount}
            modifiers={availableModifiers}
            onApply={onBatchConfigure}
            onClose={handleClose}
          />
        ) : undefined,
        // Hide secondary actions when in configure mode (showing content instead)
        shouldHideSecondaryActions: activeMode === "configure",
      },
      {
        id: "add",
        icon: activeMode === "add" ? X : Plus,
        bgClassName: "bg-primary text-primary-foreground hover:bg-primary/90",
        content: (
          <AddContent
            exercises={exercises}
            onExerciseAdd={onExerciseAdd}
            onBreakAdd={onBreakAdd}
            showBreakOption={showBreakOption}
            defaultConfig={defaultConfig}
            onClose={handleClose}
          />
        ),
        secondaryActions: [],
      },
      ...(helpContent ? [{
        id: "help",
        icon: HelpCircle,
        bgClassName: activeMode === "help" ? "bg-primary text-primary-foreground hover:bg-primary/90" : undefined,
        content: <HelpContent helpContent={helpContent} />,
        secondaryActions: [],
      }] : []),
    ]
  }, [
    activeMode,
    selectedCount,
    canMerge,
    onMerge,
    onClone,
    onBatchConfigure,
    availableModifiers,
    onDelete,
    exercises,
    onExerciseAdd,
    onBreakAdd,
    showBreakOption,
    defaultConfig,
    helpContent,
    handleClose,
  ])

  // Map "configure" mode to "select" for Dock (configure is a sub-mode of select)
  const dockActiveId = activeMode === "configure" ? "select" : activeMode

  return (
    <Dock
      actions={actions}
      activeActionId={dockActiveId}
      onActionActivate={(id) => {
        // If clicking on select while in configure mode, go back to select mode
        if (id === "select" && activeMode === "configure") {
          onModeChange("select")
        } else {
          onModeChange(id as DockMode)
        }
      }}
      className={className}
      enableAnimations={enableAnimations}
    />
  )
}
