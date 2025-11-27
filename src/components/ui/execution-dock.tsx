"use client"

import { useEffect, useCallback, useMemo, useState, type ReactNode } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Check,
  Plus,
  SkipForward,
  RotateCcw,
  Pencil,
  X,
} from "lucide-react"
import { Dock, type DockPrimaryAction } from "./dock"

export type ExecutionDockProps = {
  // Navigation state
  currentIndex: number
  totalExercises: number
  isFirstExercise: boolean
  isLastExercise: boolean

  // Review mode state (Phase 22.3)
  isReviewing: boolean
  viewingIndex: number | null
  activeExerciseIndex: number // The actual current exercise (not reviewing)

  // Edit mode state - for editing completed exercises
  isEditing: boolean
  canEdit: boolean // true if viewing a completed (not skipped) exercise

  // Playback state
  isPaused: boolean
  isTimeBased: boolean
  goalType: "strict" | "elastic"

  // Actions
  onPrevious: () => void
  onNext: () => void
  onTogglePause: () => void
  onComplete: () => void
  onSkip: () => void
  onResume: () => void // Exit review mode, go back to active exercise
  onRedo: () => void // Restart from current viewing position
  onStartEditing: () => void // Enter edit mode
  onSaveEditing: () => void // Save changes and exit edit mode
  onCancelEditing: () => void // Discard changes and exit edit mode

  // Content panels (Phase 30.6)
  /** Content to show when "add exercise" action is active */
  addExerciseContent?: ReactNode
  /** Content to show when "skip exercise" action is active (confirmation) */
  skipConfirmContent?: ReactNode
  /** Called when skip is confirmed (from skip content) */
  onSkipConfirmed?: () => void

  // Config
  className?: string
  enableAnimations?: boolean
}

export function ExecutionDock({
  currentIndex,
  totalExercises,
  isFirstExercise,
  isLastExercise,
  isReviewing,
  viewingIndex,
  activeExerciseIndex: _activeExerciseIndex,
  isEditing,
  canEdit,
  isPaused,
  isTimeBased,
  goalType,
  onPrevious,
  onNext,
  onTogglePause,
  onComplete,
  onSkip,
  onResume,
  onRedo,
  onStartEditing,
  onSaveEditing,
  onCancelEditing,
  addExerciseContent,
  skipConfirmContent,
  onSkipConfirmed,
  className,
  enableAnimations = true,
}: ExecutionDockProps) {
  // Track which action is active (for content panels)
  const [activeMode, setActiveMode] = useState<"add" | "skip" | null>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // If a content panel is open, Escape closes it
      if (activeMode !== null) {
        if (event.key === "Escape") {
          setActiveMode(null)
        }
        return // Block other shortcuts when content is open
      }

      // Edit mode shortcuts
      if (isEditing) {
        switch (event.key) {
          case "Enter":
            onSaveEditing()
            break
          case "Escape":
            onCancelEditing()
            break
        }
        return // Block all other shortcuts in edit mode
      }

      switch (event.key) {
        case "ArrowLeft":
          if (!isFirstExercise) onPrevious()
          break
        case "ArrowRight":
          if (!isLastExercise) onNext()
          break
        case " ": // Space bar
          event.preventDefault()
          if (isReviewing) {
            onResume()
          } else if (isTimeBased && goalType === "strict") {
            onTogglePause()
          } else {
            onComplete()
          }
          break
        case "Enter":
          if (isReviewing) {
            onResume()
          } else {
            onComplete()
          }
          break
        case "Escape":
          if (isReviewing) {
            onResume()
          }
          break
        case "e":
        case "E":
          if (isReviewing && canEdit) {
            onStartEditing()
          }
          break
        case "r":
        case "R":
          if (isReviewing) {
            onRedo()
          }
          break
        case "s":
        case "S":
          if (!isReviewing) {
            // If we have skip content, open it; otherwise skip directly
            if (skipConfirmContent) {
              setActiveMode("skip")
            } else {
              onSkip()
            }
          }
          break
        case "a":
        case "A":
          if (!isReviewing && addExerciseContent) {
            setActiveMode("add")
          }
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isFirstExercise, isLastExercise, isTimeBased, goalType, isReviewing, isEditing, canEdit, activeMode, addExerciseContent, skipConfirmContent, onPrevious, onNext, onTogglePause, onComplete, onSkip, onResume, onRedo, onStartEditing, onSaveEditing, onCancelEditing])

  // Calculate display index based on review mode
  const displayIndex = isReviewing && viewingIndex !== null ? viewingIndex : currentIndex

  // Handle skip confirmation
  const handleSkipConfirmed = useCallback(() => {
    setActiveMode(null)
    if (onSkipConfirmed) {
      onSkipConfirmed()
    } else {
      onSkip()
    }
  }, [onSkip, onSkipConfirmed])

  // Build actions based on current state
  const actions = useMemo((): DockPrimaryAction[] => {
    // Review mode actions
    if (isReviewing) {
      return [
        {
          id: "prev",
          icon: ChevronLeft,
          secondaryActions: [],
          onClick: onPrevious,
          disabled: isFirstExercise,
        },
        {
          id: "edit",
          icon: Pencil,
          bgClassName: "bg-blue-500 text-white hover:bg-blue-600",
          secondaryActions: [
            {
              id: "cancel",
              icon: X,
              label: "Cancel",
              onClick: onCancelEditing,
              bgClassName: "bg-background border-2 border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/50",
            },
            {
              id: "save",
              icon: Check,
              label: "Save",
              onClick: onSaveEditing,
              bgClassName: "bg-green-600 text-white hover:bg-green-700",
            },
          ],
          hidden: !canEdit,
        },
        {
          id: "resume",
          icon: Play,
          bgClassName: "bg-green-600 text-white hover:bg-green-700",
          secondaryActions: [],
          onClick: onResume,
        },
        {
          id: "redo",
          icon: RotateCcw,
          bgClassName: "bg-orange-500 text-white hover:bg-orange-600",
          secondaryActions: [],
          onClick: onRedo,
        },
        {
          id: "next",
          icon: ChevronRight,
          secondaryActions: [],
          onClick: onNext,
          disabled: isLastExercise,
        },
      ]
    }

    // Normal mode actions
    const mainAction = (() => {
      // For strict goal time-based exercises, show pause/play
      if (isTimeBased && goalType === "strict") {
        return {
          id: "pause",
          icon: isPaused ? Play : Pause,
          bgClassName: isPaused
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted hover:bg-muted/80",
          secondaryActions: [],
          onClick: onTogglePause,
        }
      }

      // For elastic goal or rep-based exercises, show complete/done button
      return {
        id: "complete",
        icon: Check,
        bgClassName: "bg-green-600 text-white hover:bg-green-700",
        secondaryActions: [],
        onClick: onComplete,
      }
    })()

    return [
      {
        id: "prev",
        icon: ChevronLeft,
        secondaryActions: [],
        onClick: onPrevious,
        disabled: isFirstExercise,
      },
      {
        id: "skip",
        icon: SkipForward,
        secondaryActions: [],
        // If we have skip content, it will show via content prop; otherwise skip directly
        content: skipConfirmContent ? (
          <SkipConfirmWrapper onConfirm={handleSkipConfirmed} onCancel={() => setActiveMode(null)}>
            {skipConfirmContent}
          </SkipConfirmWrapper>
        ) : undefined,
        onClick: skipConfirmContent ? undefined : onSkip,
      },
      mainAction as DockPrimaryAction,
      {
        id: "add",
        icon: activeMode === "add" ? X : Plus,
        bgClassName: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondaryActions: [],
        content: addExerciseContent,
      },
      {
        id: "next",
        icon: ChevronRight,
        secondaryActions: [],
        onClick: onNext,
        disabled: isLastExercise,
      },
    ]
  }, [
    isReviewing,
    isFirstExercise,
    isLastExercise,
    canEdit,
    isTimeBased,
    goalType,
    isPaused,
    activeMode,
    addExerciseContent,
    skipConfirmContent,
    onPrevious,
    onNext,
    onSkip,
    onComplete,
    onResume,
    onRedo,
    onTogglePause,
    onCancelEditing,
    onSaveEditing,
    handleSkipConfirmed,
  ])

  // Determine active action ID
  const activeActionId = useMemo(() => {
    if (isEditing) return "edit"
    if (activeMode) return activeMode
    return null
  }, [isEditing, activeMode])

  const handleActionActivate = useCallback(
    (id: string | null) => {
      if (id === "edit") {
        onStartEditing()
      } else if (id === null && isEditing) {
        onCancelEditing()
      } else if (id === "add" || id === "skip") {
        setActiveMode(id)
      } else {
        setActiveMode(null)
      }
    },
    [isEditing, onStartEditing, onCancelEditing]
  )

  // Build status label
  const statusLabel = useMemo(() => {
    if (isEditing) {
      return (
        <span className="text-blue-700 dark:text-blue-300">
          Editing {displayIndex + 1} / {totalExercises}
        </span>
      )
    }
    if (isReviewing) {
      return (
        <span className="text-amber-700 dark:text-amber-300">
          Reviewing {displayIndex + 1} / {totalExercises}
        </span>
      )
    }
    return `${displayIndex + 1} / ${totalExercises}`
  }, [isEditing, isReviewing, displayIndex, totalExercises])

  return (
    <Dock
      actions={actions}
      activeActionId={activeActionId}
      onActionActivate={handleActionActivate}
      statusLabel={statusLabel}
      className={className}
      enableAnimations={enableAnimations}
    />
  )
}

// Helper wrapper for skip confirmation content
type SkipConfirmWrapperProps = {
  children: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

function SkipConfirmWrapper({ children, onConfirm, onCancel }: SkipConfirmWrapperProps) {
  return (
    <div className="p-4">
      {children}
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
        >
          Skip Exercise
        </button>
      </div>
    </div>
  )
}
