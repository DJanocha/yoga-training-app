"use client"

import { cn } from "@/lib/utils"
import { motion, useReducedMotion, AnimatePresence } from "framer-motion"
import { useCallback } from "react"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

// ============================================================================
// Types
// ============================================================================

export type DockAction = {
  id: string
  icon: LucideIcon
  label?: string
  content?: ReactNode
  bgClassName?: string
  badge?: ReactNode | number
  onClick?: () => void
  disabled?: boolean
  hidden?: boolean
}

export type DockPrimaryAction = DockAction & {
  secondaryActions: DockAction[]
  shouldHideSecondaryActions?: boolean
}

export type DockProps = {
  actions: DockPrimaryAction[]
  activeActionId: string | null
  onActionActivate: (id: string | null) => void
  statusLabel?: ReactNode
  className?: string
  enableAnimations?: boolean
  /** Show backdrop when content is open (prevents clicks behind) */
  showBackdrop?: boolean
}

// ============================================================================
// Animation Configuration
// ============================================================================

const springTransition = { type: "spring" as const, stiffness: 400, damping: 30 }
const fastSpringTransition = { type: "spring" as const, stiffness: 500, damping: 35 }

// ============================================================================
// Sub-Components
// ============================================================================

type DockButtonProps = {
  action: DockAction
  onClick: () => void
  isActive?: boolean
  size?: "sm" | "md" | "lg"
  shouldReduceMotion?: boolean
}

function DockButton({
  action,
  onClick,
  isActive = false,
  size = "md",
  shouldReduceMotion = false,
}: DockButtonProps) {
  const Icon = action.icon

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-11 h-11",
    lg: "w-14 h-14",
  }

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const hoverAnimation =
    shouldReduceMotion || action.disabled
      ? {}
      : { scale: 1.1, transition: { type: "spring" as const, stiffness: 400, damping: 25 } }

  const tapAnimation = action.disabled ? {} : { scale: 0.95 }

  // Determine button styling
  const getButtonClasses = () => {
    if (action.disabled) {
      return "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
    }

    if (action.bgClassName) {
      return action.bgClassName
    }

    if (isActive) {
      return "bg-primary text-primary-foreground hover:bg-primary/90"
    }

    return "bg-muted hover:bg-muted/80"
  }

  // If it has a label, render as pill button
  if (action.label) {
    return (
      <motion.button
        whileHover={hoverAnimation}
        whileTap={tapAnimation}
        onClick={onClick}
        disabled={action.disabled}
        className={cn(
          "h-11 px-4 rounded-full flex items-center justify-center gap-2 transition-colors",
          getButtonClasses()
        )}
        aria-label={action.label}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
      </motion.button>
    )
  }

  // Render as icon button
  const button = (
    <motion.button
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      onClick={onClick}
      disabled={action.disabled}
      className={cn(
        "rounded-full flex items-center justify-center transition-colors",
        sizeClasses[size],
        getButtonClasses()
      )}
      aria-label={action.id}
    >
      <Icon className={iconSizes[size]} />
    </motion.button>
  )

  // Badge overlay
  if (action.badge !== undefined && action.badge !== null) {
    const badgeContent =
      typeof action.badge === "number" ? (
        <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-semibold">
          {action.badge}
        </span>
      ) : (
        <span className="absolute -top-1.5 -right-1.5">{action.badge}</span>
      )

    return (
      <div className="relative overflow-visible">
        {button}
        {badgeContent}
      </div>
    )
  }

  return button
}

function DockSeparator() {
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      exit={{ opacity: 0, scaleY: 0 }}
      transition={springTransition}
      className="w-px h-6 bg-border mx-1"
    />
  )
}

// ============================================================================
// Main Dock Component
// ============================================================================

export function Dock({
  actions,
  activeActionId,
  onActionActivate,
  statusLabel,
  className,
  enableAnimations = true,
  showBackdrop = true,
}: DockProps) {
  const shouldReduceMotion = useReducedMotion()

  // Haptic feedback
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10)
    }
  }, [])

  const handlePrimaryClick = useCallback(
    (action: DockPrimaryAction) => {
      triggerHaptic()

      // Toggle: if already active, deactivate; otherwise activate
      if (activeActionId === action.id) {
        onActionActivate(null)
      } else {
        onActionActivate(action.id)
        // Only call onClick when activating, not when toggling off
        action.onClick?.()
      }
    },
    [activeActionId, onActionActivate, triggerHaptic]
  )

  const handleSecondaryClick = useCallback(
    (action: DockAction) => {
      triggerHaptic()
      action.onClick?.()
    },
    [triggerHaptic]
  )

  const handleBackdropClick = useCallback(() => {
    triggerHaptic()
    onActionActivate(null)
  }, [onActionActivate, triggerHaptic])

  // Find active action
  const activeAction = actions.find((a) => a.id === activeActionId)
  const hasActiveAction = activeAction !== undefined

  // Visible primary actions (respecting hidden prop)
  const visiblePrimaryActions = actions.filter((a) => !a.hidden)

  // Should show secondary actions?
  const showSecondaryActions =
    activeAction &&
    activeAction.secondaryActions.length > 0 &&
    !activeAction.shouldHideSecondaryActions

  // Should show content?
  const showContent = activeAction?.content !== undefined

  // Determine dock background tint based on active action
  const getDockTintClasses = () => {
    if (!activeAction) return "bg-background/95 border-border"

    // Extract color hints from bgClassName
    const bg = activeAction.bgClassName || ""
    if (bg.includes("blue")) return "bg-blue-50/95 dark:bg-blue-950/95 border-blue-400 dark:border-blue-600"
    if (bg.includes("green")) return "bg-green-50/95 dark:bg-green-950/95 border-green-400 dark:border-green-600"
    if (bg.includes("amber") || bg.includes("orange")) return "bg-amber-50/95 dark:bg-amber-950/95 border-amber-400 dark:border-amber-600"
    if (bg.includes("red") || bg.includes("destructive")) return "bg-red-50/95 dark:bg-red-950/95 border-red-400 dark:border-red-600"
    if (bg.includes("primary")) return "bg-primary/5 dark:bg-primary/10 border-primary/30"

    return "bg-background/95 border-border"
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: springTransition,
    },
  }

  const contentVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: springTransition,
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.2 },
    },
  }

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  }

  return (
    <>
      {/* Backdrop - prevents clicks behind dock when content is open */}
      <AnimatePresence>
        {showBackdrop && showContent && (
          <motion.div
            key="dock-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleBackdropClick}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Dock Container */}
      <motion.div
        className={cn(
          "fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center",
          className
        )}
        initial={enableAnimations ? "hidden" : "visible"}
        animate="visible"
        variants={enableAnimations ? containerVariants : {}}
      >
        {/* Unified Dock Container (content + bar in one element) */}
        <motion.div
          className={cn(
            "shadow-2xl border backdrop-blur-md overflow-hidden",
            showContent ? "rounded-2xl" : "rounded-full",
            getDockTintClasses()
          )}
          layout
          transition={enableAnimations ? fastSpringTransition : { duration: 0 }}
        >
          {/* Content Area (inside dock container, above bar) */}
          <AnimatePresence mode="wait">
            {showContent && (
              <motion.div
                key={`content-${activeActionId}`}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-[320px] overflow-hidden"
              >
                {activeAction.content}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dock Bar */}
          <motion.div
            className={cn(
              "px-3 pt-4 pb-3 flex items-center gap-2",
              showContent && "border-t border-inherit pt-3"
            )}
            layout
            transition={enableAnimations ? fastSpringTransition : { duration: 0 }}
          >
            <AnimatePresence mode="popLayout">
              {/* When active: show indicator (clickable to close) + separator + secondary actions */}
              {hasActiveAction && activeAction && (
                <>
                  {/* Active action as indicator - NOW CLICKABLE TO CLOSE */}
                  <motion.div
                    key={`indicator-${activeAction.id}`}
                    initial={{ opacity: 0, scale: 0.5, width: 0 }}
                    animate={{ opacity: 1, scale: 1, width: "auto" }}
                    exit={{ opacity: 0, scale: 0.5, width: 0 }}
                    transition={springTransition}
                    className="overflow-visible"
                  >
                    <DockButton
                      action={activeAction}
                      onClick={() => handlePrimaryClick(activeAction)}
                      isActive
                      shouldReduceMotion={shouldReduceMotion ?? false}
                    />
                  </motion.div>

                  {/* Separator - show if there are secondary actions */}
                  {showSecondaryActions && <DockSeparator key="separator" />}

                  {/* Secondary actions */}
                  {showSecondaryActions &&
                    activeAction.secondaryActions
                      .filter((a) => !a.hidden)
                      .map((secondary) => (
                        <motion.div
                          key={secondary.id}
                          initial={{ opacity: 0, scale: 0.5, width: 0 }}
                          animate={{ opacity: 1, scale: 1, width: "auto" }}
                          exit={{ opacity: 0, scale: 0.5, width: 0 }}
                          transition={springTransition}
                          className="overflow-hidden"
                        >
                          <DockButton
                            action={secondary}
                            onClick={() => handleSecondaryClick(secondary)}
                            shouldReduceMotion={shouldReduceMotion ?? false}
                          />
                        </motion.div>
                      ))}
                </>
              )}

              {/* When inactive: show all primary actions */}
              {!hasActiveAction &&
                visiblePrimaryActions.map((action) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={springTransition}
                  >
                    <DockButton
                      action={action}
                      onClick={() => handlePrimaryClick(action)}
                      shouldReduceMotion={shouldReduceMotion ?? false}
                    />
                  </motion.div>
                ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Status Label below dock */}
        {statusLabel && (
          <div className="text-center mt-2">
            <span className="text-xs bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full text-muted-foreground">
              {statusLabel}
            </span>
          </div>
        )}
      </motion.div>
    </>
  )
}

// ============================================================================
// Exports
// ============================================================================

export type { DockAction as Action, DockPrimaryAction as PrimaryAction }
