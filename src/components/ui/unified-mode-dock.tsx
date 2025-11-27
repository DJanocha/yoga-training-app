"use client"

import { cn } from "@/lib/utils"
import { motion, useReducedMotion, AnimatePresence, type Variants } from "framer-motion"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import {
  Square,
  CheckSquare,
  Plus,
  HelpCircle,
  Menu,
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
import type { MeasureType } from "@/db/types"

// Mode types for the dock
export type DockMode = "select" | "add" | "help" | null

// Exercise item type for the picker
export type ExerciseItem = {
  id: number
  name: string
  description?: string | null
}

// Add exercise callback config
export type AddExerciseConfig = {
  targetValue: number
  measure: MeasureType
}

export type UnifiedModeDockProps = {
  // Mode state
  activeMode: DockMode
  onModeChange: (mode: DockMode) => void

  // Selection mode props
  selectedCount: number
  onMerge?: () => void
  onClone?: () => void
  onConfigure?: () => void
  onDelete?: () => void
  canMerge?: boolean

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

  // Menu mode (optional future expansion)
  menuItems?: Array<{
    id: string
    label: string
    icon: React.ReactNode
    onClick: () => void
  }>
  showMenuButton?: boolean

  // Config
  className?: string
  enableAnimations?: boolean
}

export function UnifiedModeDock({
  activeMode,
  onModeChange,
  selectedCount,
  onMerge,
  onClone,
  onConfigure,
  onDelete,
  canMerge = false,
  exercises = [],
  onExerciseAdd,
  onBreakAdd,
  showBreakOption = true,
  defaultConfig = { targetValue: 30, measure: "time" },
  helpContent,
  menuItems,
  showMenuButton = false,
  className,
  enableAnimations = true,
}: UnifiedModeDockProps) {
  const shouldReduceMotion = useReducedMotion()
  const dockRef = useRef<HTMLDivElement>(null)

  // Add mode state
  const [searchQuery, setSearchQuery] = useState("")
  const [targetValue, setTargetValue] = useState(defaultConfig.targetValue)
  const [measure, setMeasure] = useState<MeasureType>(defaultConfig.measure)

  // Reset add mode state when mode changes
  useEffect(() => {
    if (activeMode === "add") {
      setSearchQuery("")
      setTargetValue(defaultConfig.targetValue)
      setMeasure(defaultConfig.measure)
    }
  }, [activeMode, defaultConfig.targetValue, defaultConfig.measure])

  // Filter exercises by search
  const filteredExercises = useMemo(() => {
    if (!searchQuery) return exercises
    const query = searchQuery.toLowerCase()
    return exercises.filter((ex) =>
      ex.name.toLowerCase().includes(query) ||
      ex.description?.toLowerCase().includes(query)
    )
  }, [exercises, searchQuery])

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

  // Haptic feedback
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10)
    }
  }, [])

  const handleButtonClick = useCallback(
    (callback: () => void) => {
      triggerHaptic()
      callback()
    },
    [triggerHaptic]
  )

  const handleModeToggle = useCallback(
    (mode: DockMode) => {
      triggerHaptic()
      onModeChange(activeMode === mode ? null : mode)
    },
    [activeMode, onModeChange, triggerHaptic]
  )

  const handleExerciseClick = useCallback(
    (exerciseId: number) => {
      if (onExerciseAdd) {
        triggerHaptic()
        onExerciseAdd(exerciseId, { targetValue, measure })
        onModeChange(null)
      }
    },
    [onExerciseAdd, targetValue, measure, triggerHaptic, onModeChange]
  )

  const handleBreakClick = useCallback(() => {
    if (onBreakAdd) {
      triggerHaptic()
      onBreakAdd({ targetValue: 10, measure: "time" })
      onModeChange(null)
    }
  }, [onBreakAdd, triggerHaptic, onModeChange])

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 400, damping: 30 },
    },
  }

  const buttonVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 500, damping: 30 },
    },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
  }

  const expandedContentVariants: Variants = {
    hidden: { opacity: 0, height: 0, marginBottom: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      marginBottom: 8,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: {
      opacity: 0,
      height: 0,
      marginBottom: 0,
      transition: { duration: 0.2 },
    },
  }

  const hoverAnimation = shouldReduceMotion
    ? {}
    : {
        scale: 1.1,
        transition: { type: "spring" as const, stiffness: 400, damping: 25 },
      }

  const tapAnimation = { scale: 0.95 }

  const hasSelectionActions = activeMode === "select" && selectedCount > 0

  return (
    <motion.div
      ref={dockRef}
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center",
        className
      )}
      initial={enableAnimations ? "hidden" : "visible"}
      animate="visible"
      variants={enableAnimations ? containerVariants : {}}
    >
      {/* Expanded Content Area (above dock) */}
      <AnimatePresence mode="wait">
        {activeMode === "add" && (
          <motion.div
            key="add-content"
            variants={expandedContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-[320px] rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-2xl overflow-hidden"
          >
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
          </motion.div>
        )}

        {activeMode === "help" && helpContent && (
          <motion.div
            key="help-content"
            variants={expandedContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-[320px] rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-2xl p-4"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dock Bar */}
      <motion.div
        className="rounded-full px-2 py-2 shadow-2xl border border-border bg-background/95 backdrop-blur-md flex items-center gap-1"
        layout
        transition={
          enableAnimations
            ? { type: "spring", stiffness: 400, damping: 35 }
            : { duration: 0 }
        }
      >
        {/* Selection Actions (appear when in select mode with items selected) */}
        <AnimatePresence mode="popLayout">
          {hasSelectionActions && (
            <>
              {/* Merge */}
              {canMerge && onMerge && (
                <motion.button
                  key="merge"
                  variants={buttonVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={hoverAnimation}
                  whileTap={tapAnimation}
                  onClick={() => handleButtonClick(onMerge)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
                  aria-label="Merge selected items"
                >
                  <Link className="h-4 w-4" />
                </motion.button>
              )}

              {/* Clone */}
              {onClone && (
                <motion.button
                  key="clone"
                  variants={buttonVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={hoverAnimation}
                  whileTap={tapAnimation}
                  onClick={() => handleButtonClick(onClone)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
                  aria-label="Clone selected items"
                >
                  <Copy className="h-4 w-4" />
                </motion.button>
              )}

              {/* Configure */}
              {onConfigure && (
                <motion.button
                  key="configure"
                  variants={buttonVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={hoverAnimation}
                  whileTap={tapAnimation}
                  onClick={() => handleButtonClick(onConfigure)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors relative"
                  aria-label={`Configure ${selectedCount} selected items`}
                >
                  <Settings className="h-4 w-4" />
                  {selectedCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                      {selectedCount}
                    </span>
                  )}
                </motion.button>
              )}

              {/* Delete */}
              {onDelete && (
                <motion.button
                  key="delete"
                  variants={buttonVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={hoverAnimation}
                  whileTap={tapAnimation}
                  onClick={() => handleButtonClick(onDelete)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-muted hover:bg-destructive/10 hover:text-destructive transition-colors"
                  aria-label="Delete selected items"
                >
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              )}

              {/* Separator */}
              <motion.div
                key="separator"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-px h-6 bg-border mx-1"
              />
            </>
          )}
        </AnimatePresence>

        {/* Mode Buttons */}
        {/* Select Mode */}
        <motion.button
          whileHover={hoverAnimation}
          whileTap={tapAnimation}
          onClick={() => handleModeToggle("select")}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            activeMode === "select"
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted hover:bg-muted/80"
          )}
          aria-label={activeMode === "select" ? "Exit selection mode" : "Enter selection mode"}
        >
          {activeMode === "select" ? (
            <CheckSquare className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </motion.button>

        {/* Add Mode */}
        <motion.button
          whileHover={hoverAnimation}
          whileTap={tapAnimation}
          onClick={() => handleModeToggle("add")}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            activeMode === "add"
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          aria-label={activeMode === "add" ? "Close exercise picker" : "Add exercise"}
        >
          {activeMode === "add" ? (
            <X className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </motion.button>

        {/* Help Mode */}
        {helpContent && (
          <motion.button
            whileHover={hoverAnimation}
            whileTap={tapAnimation}
            onClick={() => handleModeToggle("help")}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              activeMode === "help"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted hover:bg-muted/80"
            )}
            aria-label={activeMode === "help" ? "Close help" : "Show help"}
          >
            <HelpCircle className="h-4 w-4" />
          </motion.button>
        )}

        {/* Menu Mode (optional) */}
        {showMenuButton && menuItems && menuItems.length > 0 && (
          <motion.button
            whileHover={hoverAnimation}
            whileTap={tapAnimation}
            onClick={() => {/* TODO: Menu mode */}}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  )
}
