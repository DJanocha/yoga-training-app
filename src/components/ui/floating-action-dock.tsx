"use client";

import { cn } from "@/lib/utils";
import { motion, useReducedMotion, AnimatePresence, type Variants } from "framer-motion";
import { useRef, useEffect, useCallback } from "react";
import {
  Square,
  CheckSquare,
  Plus,
  Link,
  Copy,
  Settings,
  Trash2,
} from "lucide-react";

export type DockAction = {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive" | "primary";
  badge?: number;
};

export type FloatingActionDockProps = {
  // Selection state
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
  selectedCount: number;

  // Primary actions (always visible when not in selection mode)
  onAdd: () => void;

  // Selection actions (visible when items selected)
  onMerge?: () => void;
  onClone?: () => void;
  onConfigure?: () => void;
  onDelete?: () => void;

  // Config
  className?: string;
  canMerge?: boolean; // Usually selectedCount >= 2
  enableAnimations?: boolean;
  animationDuration?: number;
};

export function FloatingActionDock({
  selectionMode,
  onToggleSelectionMode,
  selectedCount,
  onAdd,
  onMerge,
  onClone,
  onConfigure,
  onDelete,
  className,
  canMerge = false,
  enableAnimations = true,
  animationDuration = 0.3,
}: FloatingActionDockProps) {
  const shouldReduceMotion = useReducedMotion();
  const dockRef = useRef<HTMLDivElement>(null);

  // Click outside to cancel selection - DISABLED
  // This was causing issues because clicks on selectable items (divs) were being
  // treated as "outside" clicks. Users can exit selection mode via:
  // 1. Click the CheckSquare button on the dock (toggles selection mode)
  // 2. Press Escape key
  // 3. Complete an action (merge, clone, delete, configure)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectionMode) {
        onToggleSelectionMode();
      }
      if (event.key === "Delete" && selectionMode && selectedCount > 0 && onDelete) {
        onDelete();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectionMode, selectedCount, onDelete, onToggleSelectionMode]);

  // Haptic feedback (if available)
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const handleButtonClick = useCallback(
    (callback: () => void) => {
      triggerHaptic();
      callback();
    },
    [triggerHaptic]
  );

  const containerVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 30,
      },
    },
  };

  const buttonVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.15,
      },
    },
  };

  const hoverAnimation = shouldReduceMotion
    ? {}
    : {
        scale: 1.1,
        transition: {
          type: "spring" as const,
          stiffness: 400,
          damping: 25,
        },
      };

  const tapAnimation = { scale: 0.95 };

  const isExpanded = selectionMode && selectedCount > 0;

  return (
    <motion.div
      ref={dockRef}
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-50",
        className
      )}
      initial={enableAnimations ? "hidden" : "visible"}
      animate="visible"
      variants={enableAnimations ? containerVariants : {}}
    >
      <motion.div
        className="rounded-full px-2 py-2 shadow-2xl border border-border bg-background/95 backdrop-blur-md flex items-center gap-1"
        animate={{
          width: "auto",
        }}
        transition={
          enableAnimations
            ? {
                type: "spring",
                stiffness: 400,
                damping: 35,
                duration: animationDuration,
              }
            : { duration: 0 }
        }
      >
        {/* Selection Actions (appear when items selected) */}
        <AnimatePresence mode="popLayout">
          {isExpanded && (
            <>
              {/* Merge - show when 2+ selected */}
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
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                className="w-px h-6 bg-border mx-1"
              />
            </>
          )}
        </AnimatePresence>

        {/* Primary Actions (always visible) */}
        {/* Select/Cancel Toggle - Uses Square/CheckSquare to indicate selection state */}
        <motion.button
          whileHover={hoverAnimation}
          whileTap={tapAnimation}
          onClick={() => handleButtonClick(onToggleSelectionMode)}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            selectionMode
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted hover:bg-muted/80"
          )}
          aria-label={selectionMode ? "Exit selection mode" : "Enter selection mode"}
        >
          {selectionMode ? (
            <CheckSquare className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </motion.button>

        {/* Add Button */}
        <motion.button
          whileHover={hoverAnimation}
          whileTap={tapAnimation}
          onClick={() => handleButtonClick(onAdd)}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          aria-label="Add exercise"
        >
          <Plus className="h-4 w-4" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
