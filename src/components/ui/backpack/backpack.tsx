"use client"

import * as React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { cn } from "@/lib/utils"

// =============================================================================
// TYPES
// =============================================================================

export type BackpackEffect = "easier" | "harder" | "neutral" | null

export type BackpackItem = {
  id: string | number
  name: string
  value?: string | number | null
  unit?: string | null
  metadata?: Record<string, unknown>
}

export type ActiveItem = {
  id: string | number
  effect: BackpackEffect
}

// =============================================================================
// CONTEXT
// =============================================================================

type BackpackContextValue = {
  items: BackpackItem[]
  activeItems: ActiveItem[]
  cols: number
  rows: number
  editable: boolean
  showAdd: boolean
  // Actions
  toggleItem: (id: string | number, effect: BackpackEffect) => void
  addItem: (item: BackpackItem) => void
  removeItem: (id: string | number) => void
  getItemEffect: (id: string | number) => BackpackEffect
  isItemActive: (id: string | number) => boolean
  // Callbacks
  onToggle?: (id: string | number, effect: BackpackEffect) => void
  onAdd?: () => void
  onRemove?: (id: string | number) => void
}

const BackpackContext = createContext<BackpackContextValue | null>(null)

function useBackpackContext() {
  const context = useContext(BackpackContext)
  if (!context) {
    throw new Error("Backpack components must be used within a <Backpack.Root>")
  }
  return context
}

// =============================================================================
// ROOT
// =============================================================================

type BackpackRootProps = {
  children: React.ReactNode
  /** Items available in the backpack */
  items?: BackpackItem[]
  /** Currently active items with their effects */
  activeItems?: ActiveItem[]
  /** Number of columns in grid */
  cols?: number
  /** Number of rows in grid */
  rows?: number
  /** Whether items can be toggled */
  editable?: boolean
  /** Whether to show the add button */
  showAdd?: boolean
  /** Called when an item is toggled */
  onToggle?: (id: string | number, effect: BackpackEffect) => void
  /** Called when add button is clicked */
  onAdd?: () => void
  /** Called when an item is removed */
  onRemove?: (id: string | number) => void
  /** Control active items externally (controlled mode) */
  value?: ActiveItem[]
  /** Called when active items change (controlled mode) */
  onChange?: (items: ActiveItem[]) => void
  className?: string
}

function BackpackRoot({
  children,
  items: initialItems = [],
  activeItems: initialActiveItems = [],
  cols = 3,
  rows = 3,
  editable = true,
  showAdd = false,
  onToggle,
  onAdd,
  onRemove,
  value,
  onChange,
  className,
}: BackpackRootProps) {
  // Internal state for uncontrolled mode
  const [internalItems, setInternalItems] = useState<BackpackItem[]>(initialItems)
  const [internalActiveItems, setInternalActiveItems] = useState<ActiveItem[]>(initialActiveItems)

  // Determine if we're in controlled mode
  const isControlled = value !== undefined

  // Use controlled or uncontrolled state
  const items = initialItems.length > 0 ? initialItems : internalItems
  const activeItems = isControlled ? value : internalActiveItems

  // Helper to update active items (handles both controlled and uncontrolled)
  const updateActiveItems = useCallback(
    (updater: (prev: ActiveItem[]) => ActiveItem[]) => {
      if (isControlled) {
        onChange?.(updater(activeItems))
      } else {
        setInternalActiveItems(updater)
      }
    },
    [isControlled, onChange, activeItems]
  )

  const getItemEffect = useCallback(
    (id: string | number): BackpackEffect => {
      const active = activeItems.find((a) => a.id === id)
      return active?.effect ?? null
    },
    [activeItems]
  )

  const isItemActive = useCallback(
    (id: string | number): boolean => {
      return activeItems.some((a) => a.id === id && a.effect !== null)
    },
    [activeItems]
  )

  const toggleItem = useCallback(
    (id: string | number, effect: BackpackEffect) => {
      if (!editable) return

      updateActiveItems((prev) => {
        if (effect === null) {
          // Remove item
          return prev.filter((a) => a.id !== id)
        }
        const existing = prev.find((a) => a.id === id)
        if (existing) {
          // Update effect
          return prev.map((a) => (a.id === id ? { ...a, effect } : a))
        }
        // Add new
        return [...prev, { id, effect }]
      })

      onToggle?.(id, effect)
    },
    [editable, updateActiveItems, onToggle]
  )

  const addItem = useCallback(
    (item: BackpackItem) => {
      setInternalItems((prev) => [...prev, item])
    },
    []
  )

  const removeItem = useCallback(
    (id: string | number) => {
      setInternalItems((prev) => prev.filter((i) => i.id !== id))
      updateActiveItems((prev) => prev.filter((a) => a.id !== id))
      onRemove?.(id)
    },
    [updateActiveItems, onRemove]
  )

  const contextValue: BackpackContextValue = {
    items,
    activeItems,
    cols,
    rows,
    editable,
    showAdd,
    toggleItem,
    addItem,
    removeItem,
    getItemEffect,
    isItemActive,
    onToggle,
    onAdd,
    onRemove,
  }

  return (
    <BackpackContext.Provider value={contextValue}>
      <div className={cn("flex flex-col items-center", className)}>
        {children}
      </div>
    </BackpackContext.Provider>
  )
}

// =============================================================================
// CONTAINER (the visual backpack wrapper)
// =============================================================================

type BackpackContainerProps = {
  children: React.ReactNode
  className?: string
  /** Visual theme */
  theme?: "brown" | "gray" | "dark"
}

function BackpackContainer({
  children,
  className,
  theme = "brown",
}: BackpackContainerProps) {
  const themes = {
    brown: {
      outer: "bg-amber-950 border-amber-800",
      gradient: "linear-gradient(145deg, #78350f 0%, #451a03 100%)",
      handle: "bg-amber-800 border-amber-900",
      inner: "bg-black/30 border-amber-900/50",
    },
    gray: {
      outer: "bg-gray-800 border-gray-600",
      gradient: "linear-gradient(145deg, #374151 0%, #1f2937 100%)",
      handle: "bg-gray-700 border-gray-800",
      inner: "bg-black/30 border-gray-700/50",
    },
    dark: {
      outer: "bg-zinc-900 border-zinc-700",
      gradient: "linear-gradient(145deg, #27272a 0%, #18181b 100%)",
      handle: "bg-zinc-800 border-zinc-900",
      inner: "bg-black/40 border-zinc-800/50",
    },
  }

  const t = themes[theme]

  return (
    <div
      className={cn(
        "p-3 rounded-xl border-4 shadow-lg",
        t.outer,
        className
      )}
      style={{ background: t.gradient }}
    >
      {/* Backpack top handle */}
      <div className="flex justify-center -mt-5 mb-2">
        <div className={cn("w-12 h-4 rounded-b-lg border-x-2 border-b-2", t.handle)} />
      </div>

      {/* Inner content area */}
      <div className={cn("p-2 rounded-lg border", t.inner)}>
        {children}
      </div>
    </div>
  )
}

// =============================================================================
// GRID
// =============================================================================

type BackpackGridProps = {
  children?: React.ReactNode
  className?: string
  /** Override cols from context */
  cols?: number
  /** Gap between slots */
  gap?: number
}

function BackpackGrid({
  children,
  className,
  cols: colsOverride,
  gap = 2,
}: BackpackGridProps) {
  const { cols: contextCols } = useBackpackContext()
  const cols = colsOverride ?? contextCols

  return (
    <div
      className={cn("grid", className)}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: `${gap * 4}px`,
      }}
    >
      {children}
    </div>
  )
}

// =============================================================================
// SLOT (individual inventory slot)
// =============================================================================

type BackpackSlotProps = {
  children?: React.ReactNode
  /** Item data for this slot */
  item?: BackpackItem
  /** Size of the slot */
  size?: "sm" | "md" | "lg"
  className?: string
  /** Custom click handler (overrides default toggle) */
  onClick?: () => void
}

function BackpackSlot({
  children,
  item,
  size = "md",
  className,
  onClick,
}: BackpackSlotProps) {
  const { editable, toggleItem, getItemEffect, isItemActive } = useBackpackContext()

  const effect = item ? getItemEffect(item.id) : null
  const isActive = item ? isItemActive(item.id) : false

  const sizes = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  }

  // Effect-based styling
  const getSlotStyle = () => {
    if (!isActive) {
      return "bg-gray-700/50 border-gray-600"
    }
    if (effect === "easier") {
      return "bg-green-900/50 border-green-500 ring-2 ring-green-400/50"
    }
    if (effect === "harder") {
      return "bg-red-900/50 border-red-500 ring-2 ring-red-400/50"
    }
    return "bg-blue-900/50 border-blue-500 ring-2 ring-blue-400/50"
  }

  // Cycle effect: null → easier → harder → null
  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }
    if (!item || !editable) return

    let nextEffect: BackpackEffect
    if (!isActive || effect === null) {
      nextEffect = "easier"
    } else if (effect === "easier") {
      nextEffect = "harder"
    } else {
      nextEffect = null
    }
    toggleItem(item.id, nextEffect)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!editable && !onClick}
      className={cn(
        "relative rounded-lg border-2 transition-all",
        "flex flex-col items-center justify-center p-1",
        sizes[size],
        getSlotStyle(),
        editable && "cursor-pointer hover:brightness-110 active:scale-95",
        !editable && !onClick && "cursor-default",
        className
      )}
    >
      {children}
    </button>
  )
}

// =============================================================================
// ITEM CONTENT (what goes inside a slot)
// =============================================================================

type BackpackItemContentProps = {
  item: BackpackItem
  /** Show effect badge */
  showBadge?: boolean
  className?: string
}

function BackpackItemContent({
  item,
  showBadge = true,
  className,
}: BackpackItemContentProps) {
  const { getItemEffect, isItemActive } = useBackpackContext()

  const effect = getItemEffect(item.id)
  const isActive = isItemActive(item.id)

  // Format display name
  const formatName = () => {
    const parts = [item.name]
    if (item.value !== null && item.value !== undefined) {
      parts.push(String(item.value))
    }
    if (item.unit && item.unit !== "none" && item.unit !== "level") {
      parts.push(item.unit)
    }
    return parts.join(" ")
  }

  // Effect badge label
  const getBadgeLabel = () => {
    if (effect === "easier") return "E"
    if (effect === "harder") return "H"
    return "N"
  }

  const getBadgeColor = () => {
    if (effect === "easier") return "bg-green-500 text-white"
    if (effect === "harder") return "bg-red-500 text-white"
    return "bg-blue-500 text-white"
  }

  return (
    <div className={cn("flex flex-col items-center w-full h-full", className)}>
      {/* Effect badge */}
      {showBadge && isActive && (
        <span
          className={cn(
            "absolute -top-1 -right-1 w-5 h-5 rounded-full",
            "text-xs font-bold flex items-center justify-center",
            getBadgeColor()
          )}
        >
          {getBadgeLabel()}
        </span>
      )}

      {/* Item name */}
      <span
        className={cn(
          "text-[10px] font-medium text-center leading-tight",
          isActive ? "text-white" : "text-gray-400"
        )}
      >
        {formatName()}
      </span>

      {/* Effect indicator */}
      {isActive && (
        <div className="mt-1 text-xs">
          {effect === "easier" && <span className="text-green-400">↓</span>}
          {effect === "harder" && <span className="text-red-400">↑</span>}
          {effect === "neutral" && <span className="text-blue-400">•</span>}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// EMPTY SLOT
// =============================================================================

type BackpackEmptySlotProps = {
  size?: "sm" | "md" | "lg"
  className?: string
}

function BackpackEmptySlot({ size = "md", className }: BackpackEmptySlotProps) {
  const sizes = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  }

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-dashed border-gray-600/50 bg-gray-800/20",
        sizes[size],
        className
      )}
    />
  )
}

// =============================================================================
// ADD BUTTON
// =============================================================================

type BackpackAddButtonProps = {
  size?: "sm" | "md" | "lg"
  className?: string
  onClick?: () => void
}

function BackpackAddButton({ size = "md", className, onClick }: BackpackAddButtonProps) {
  const { onAdd, editable } = useBackpackContext()

  const sizes = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  }

  const handleClick = () => {
    onClick?.()
    onAdd?.()
  }

  if (!editable) return null

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "rounded-lg border-2 border-dashed border-amber-500/50 bg-amber-900/20",
        "flex items-center justify-center cursor-pointer",
        "hover:bg-amber-800/30 hover:border-amber-400 transition-all active:scale-95",
        sizes[size],
        className
      )}
    >
      <span className="text-2xl text-amber-400 font-bold">+</span>
    </button>
  )
}

// =============================================================================
// LABEL
// =============================================================================

type BackpackLabelProps = {
  children?: React.ReactNode
  className?: string
}

function BackpackLabel({ children, className }: BackpackLabelProps) {
  const { editable } = useBackpackContext()

  return (
    <p className={cn("text-xs text-amber-200/70 mt-2", className)}>
      {children ?? (editable ? "Tap to cycle: off → easier → harder" : "Equipment")}
    </p>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export const Backpack = {
  Root: BackpackRoot,
  Container: BackpackContainer,
  Grid: BackpackGrid,
  Slot: BackpackSlot,
  ItemContent: BackpackItemContent,
  EmptySlot: BackpackEmptySlot,
  AddButton: BackpackAddButton,
  Label: BackpackLabel,
}

// Also export hook for custom components
export { useBackpackContext }
