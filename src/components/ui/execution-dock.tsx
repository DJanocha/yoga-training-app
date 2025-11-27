"use client"

import { cn } from "@/lib/utils"
import { motion, useReducedMotion, AnimatePresence, type Variants } from "framer-motion"
import { useEffect, useCallback } from "react"
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
  onAdd: () => void
  onResume: () => void // Exit review mode, go back to active exercise
  onRedo: () => void // Restart from current viewing position
  onStartEditing: () => void // Enter edit mode
  onSaveEditing: () => void // Save changes and exit edit mode
  onCancelEditing: () => void // Discard changes and exit edit mode

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
  onAdd,
  onResume,
  onRedo,
  onStartEditing,
  onSaveEditing,
  onCancelEditing,
  className,
  enableAnimations = true,
}: ExecutionDockProps) {
  const shouldReduceMotion = useReducedMotion()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
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
            onSkip()
          }
          break
        case "a":
        case "A":
          if (!isReviewing) {
            onAdd()
          }
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isFirstExercise, isLastExercise, isTimeBased, goalType, isReviewing, isEditing, canEdit, onPrevious, onNext, onTogglePause, onComplete, onSkip, onAdd, onResume, onRedo, onStartEditing, onSaveEditing, onCancelEditing])

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

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 400, damping: 30 },
    },
  }

  const hoverAnimation = shouldReduceMotion
    ? {}
    : {
        scale: 1.1,
        transition: { type: "spring" as const, stiffness: 400, damping: 25 },
      }

  const tapAnimation = { scale: 0.95 }

  // Calculate display index based on review mode
  const displayIndex = isReviewing && viewingIndex !== null ? viewingIndex : currentIndex

  // Spring transition for animations
  const springTransition = enableAnimations
    ? { type: "spring" as const, stiffness: 400, damping: 30 }
    : { duration: 0 }

  // Determine the main action button content based on mode
  const renderMainAction = () => {
    // In review mode: show Resume button (green, prominent)
    if (isReviewing) {
      return (
        <motion.button
          whileHover={hoverAnimation}
          whileTap={tapAnimation}
          onClick={() => handleButtonClick(onResume)}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-green-600 text-white hover:bg-green-700 transition-colors"
          aria-label="Resume workout"
        >
          <Play className="h-6 w-6 ml-0.5" />
        </motion.button>
      )
    }

    // For strict goal time-based exercises, show pause/play
    if (isTimeBased && goalType === "strict") {
      return (
        <motion.button
          whileHover={hoverAnimation}
          whileTap={tapAnimation}
          onClick={() => handleButtonClick(onTogglePause)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
            isPaused
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted hover:bg-muted/80"
          )}
          aria-label={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? (
            <Play className="h-6 w-6 ml-0.5" />
          ) : (
            <Pause className="h-6 w-6" />
          )}
        </motion.button>
      )
    }

    // For elastic goal or rep-based exercises, show complete/done button
    return (
      <motion.button
        whileHover={hoverAnimation}
        whileTap={tapAnimation}
        onClick={() => handleButtonClick(onComplete)}
        className="w-14 h-14 rounded-full flex items-center justify-center bg-green-600 text-white hover:bg-green-700 transition-colors"
        aria-label="Complete exercise"
      >
        <Check className="h-6 w-6" />
      </motion.button>
    )
  }

  // Determine the secondary action button (Skip, Redo, or Edit)
  const renderSecondaryAction = () => {
    // In review mode: show Edit button (if can edit) or Redo button
    if (isReviewing) {
      if (canEdit) {
        return (
          <motion.button
            whileHover={hoverAnimation}
            whileTap={tapAnimation}
            onClick={() => handleButtonClick(onStartEditing)}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            aria-label="Edit this exercise"
          >
            <Pencil className="h-5 w-5" />
          </motion.button>
        )
      }
      // For skipped exercises, show redo instead
      return (
        <motion.button
          whileHover={hoverAnimation}
          whileTap={tapAnimation}
          onClick={() => handleButtonClick(onRedo)}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-orange-500 text-white hover:bg-orange-600 transition-colors"
          aria-label="Redo from here"
        >
          <RotateCcw className="h-5 w-5" />
        </motion.button>
      )
    }

    // Normal mode: Skip button
    return (
      <motion.button
        whileHover={hoverAnimation}
        whileTap={tapAnimation}
        onClick={() => handleButtonClick(onSkip)}
        className="w-11 h-11 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
        aria-label="Skip exercise"
      >
        <SkipForward className="h-5 w-5" />
      </motion.button>
    )
  }

  // Determine if Add button should be shown (hidden in review mode)
  const renderAddButton = () => {
    if (isReviewing) {
      // In review mode, show Redo button if we showed Edit as secondary
      if (canEdit) {
        return (
          <motion.button
            whileHover={hoverAnimation}
            whileTap={tapAnimation}
            onClick={() => handleButtonClick(onRedo)}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-orange-500/80 text-white hover:bg-orange-600 transition-colors"
            aria-label="Redo from here"
          >
            <RotateCcw className="h-5 w-5" />
          </motion.button>
        )
      }
      // Otherwise show disabled placeholder
      return (
        <div className="w-11 h-11 rounded-full flex items-center justify-center bg-muted/30 text-muted-foreground/30">
          <Plus className="h-5 w-5" />
        </div>
      )
    }

    return (
      <motion.button
        whileHover={hoverAnimation}
        whileTap={tapAnimation}
        onClick={() => handleButtonClick(onAdd)}
        className="w-11 h-11 rounded-full flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        aria-label="Add exercise"
      >
        <Plus className="h-5 w-5" />
      </motion.button>
    )
  }

  return (
    <motion.div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        className
      )}
      initial={enableAnimations ? "hidden" : "visible"}
      animate="visible"
      variants={enableAnimations ? containerVariants : {}}
    >
      <motion.div
        className={cn(
          "rounded-full px-3 py-3 shadow-2xl border backdrop-blur-md flex items-center gap-2",
          isEditing
            ? "bg-blue-50/95 dark:bg-blue-950/95 border-blue-400 dark:border-blue-600"
            : isReviewing
              ? "bg-amber-50/95 dark:bg-amber-950/95 border-amber-200 dark:border-amber-800"
              : "bg-background/95 border-border"
        )}
        layout
        transition={springTransition}
      >
        {/* Previous Button - hidden in edit mode */}
        <motion.button
          whileHover={!isFirstExercise && !isEditing ? hoverAnimation : {}}
          whileTap={!isFirstExercise && !isEditing ? tapAnimation : {}}
          onClick={() => !isFirstExercise && !isEditing && handleButtonClick(onPrevious)}
          disabled={isFirstExercise || isEditing}
          animate={{
            opacity: isEditing ? 0 : 1,
            scale: isEditing ? 0.5 : 1,
            width: isEditing ? 0 : 44,
            marginRight: isEditing ? -8 : 0,
          }}
          transition={springTransition}
          className={cn(
            "h-11 rounded-full flex items-center justify-center transition-colors overflow-hidden",
            isFirstExercise || isEditing
              ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
              : "bg-muted hover:bg-muted/80"
          )}
          aria-label="Previous exercise"
          style={{ minWidth: isEditing ? 0 : 44 }}
        >
          <ChevronLeft className="h-5 w-5 flex-shrink-0" />
        </motion.button>

        {/* Edit Mode Indicator - shows selected primary action on the left */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: "auto" }}
              exit={{ opacity: 0, scale: 0.5, width: 0 }}
              transition={springTransition}
              className="flex items-center gap-2 overflow-hidden"
            >
              {/* Edit indicator (not a button, just shows active mode) */}
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-blue-500 text-white">
                <Pencil className="h-5 w-5" />
              </div>

              {/* Separator */}
              <div className="w-px h-6 bg-blue-300 dark:bg-blue-600" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Secondary Action (Skip, Edit, or Redo) - hidden in edit mode */}
        <motion.div
          animate={{
            opacity: isEditing ? 0 : 1,
            scale: isEditing ? 0.5 : 1,
            width: isEditing ? 0 : "auto",
          }}
          transition={springTransition}
          className="overflow-hidden"
          style={{ minWidth: isEditing ? 0 : 44 }}
        >
          {renderSecondaryAction()}
        </motion.div>

        {/* Main Action (Resume/Pause/Play or Complete) - hidden in edit mode */}
        <motion.div
          animate={{
            opacity: isEditing ? 0 : 1,
            scale: isEditing ? 0.5 : 1,
            width: isEditing ? 0 : "auto",
          }}
          transition={springTransition}
          className="overflow-hidden"
          style={{ minWidth: isEditing ? 0 : 56 }}
        >
          {renderMainAction()}
        </motion.div>

        {/* Edit mode secondary actions: Cancel and Save */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: "auto" }}
              exit={{ opacity: 0, scale: 0.5, width: 0 }}
              transition={springTransition}
              className="flex items-center gap-2 overflow-hidden"
            >
              {/* Cancel Button */}
              <motion.button
                whileHover={hoverAnimation}
                whileTap={tapAnimation}
                onClick={() => handleButtonClick(onCancelEditing)}
                className="h-11 px-4 rounded-full flex items-center justify-center gap-2 bg-background border-2 border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors"
                aria-label="Cancel editing"
              >
                <X className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">Cancel</span>
              </motion.button>

              {/* Save Button */}
              <motion.button
                whileHover={hoverAnimation}
                whileTap={tapAnimation}
                onClick={() => handleButtonClick(onSaveEditing)}
                className="h-11 px-4 rounded-full flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 transition-colors"
                aria-label="Save changes"
              >
                <Check className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">Save</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tertiary Action (Add or Redo) - hidden in edit mode */}
        <motion.div
          animate={{
            opacity: isEditing ? 0 : 1,
            scale: isEditing ? 0.5 : 1,
            width: isEditing ? 0 : "auto",
          }}
          transition={springTransition}
          className="overflow-hidden"
          style={{ minWidth: isEditing ? 0 : 44 }}
        >
          {renderAddButton()}
        </motion.div>

        {/* Next Button - hidden in edit mode */}
        <motion.button
          whileHover={!isLastExercise && !isEditing ? hoverAnimation : {}}
          whileTap={!isLastExercise && !isEditing ? tapAnimation : {}}
          onClick={() => !isLastExercise && !isEditing && handleButtonClick(onNext)}
          disabled={isLastExercise || isEditing}
          animate={{
            opacity: isEditing ? 0 : 1,
            scale: isEditing ? 0.5 : 1,
            width: isEditing ? 0 : 44,
            marginLeft: isEditing ? -8 : 0,
          }}
          transition={springTransition}
          className={cn(
            "h-11 rounded-full flex items-center justify-center transition-colors overflow-hidden",
            isLastExercise || isEditing
              ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
              : "bg-muted hover:bg-muted/80"
          )}
          aria-label="Next exercise"
          style={{ minWidth: isEditing ? 0 : 44 }}
        >
          <ChevronRight className="h-5 w-5 flex-shrink-0" />
        </motion.button>
      </motion.div>

      {/* Exercise counter below dock */}
      <div className="text-center mt-2">
        <span className={cn(
          "text-xs bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full",
          isEditing
            ? "text-blue-700 dark:text-blue-300"
            : isReviewing
              ? "text-amber-700 dark:text-amber-300"
              : "text-muted-foreground"
        )}>
          {isEditing ? (
            <>Editing {displayIndex + 1} / {totalExercises}</>
          ) : isReviewing ? (
            <>Reviewing {displayIndex + 1} / {totalExercises}</>
          ) : (
            <>{displayIndex + 1} / {totalExercises}</>
          )}
        </span>
      </div>
    </motion.div>
  )
}
