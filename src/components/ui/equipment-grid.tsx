"use client"

import { ChevronUp, ChevronDown, Check } from "lucide-react"
import type { ModifierEffect } from "@/db/types"

type EquipmentItem = {
  id: number
  name: string
  value?: number | null
  unit?: string | null
}

type ActiveEquipment = {
  id: number
  effect: ModifierEffect
}

type EquipmentGridProps = {
  /** All available equipment items */
  items: EquipmentItem[]
  /** Currently active/equipped items with their effects */
  activeItems: ActiveEquipment[]
  /** Called when equipment is toggled (cycles: off → easier → harder → off) */
  onToggle: (itemId: number, newEffect: ModifierEffect | null) => void
  /** Number of columns (default 3) */
  cols?: number
  /** Number of rows (default 3) - items beyond rows*cols are hidden */
  rows?: number
  /** Whether this is editable */
  editable?: boolean
  /** Called when "+" button is clicked to add new equipment */
  onAddNew?: () => void
  /** Show the "+" button in the last slot */
  showAddButton?: boolean
  /** Scale factor (default 1.0, e.g., 1.5 for 150% size) */
  scale?: number
}

/**
 * Game-style equipment grid (backpack inventory)
 * Shows available modifiers in a compact 3x3 grid
 */
export function EquipmentGrid({
  items,
  activeItems,
  onToggle,
  cols = 3,
  rows = 3,
  editable = true,
  onAddNew,
  showAddButton = false,
  scale = 1.0,
}: EquipmentGridProps) {
  const maxDisplay = cols * rows
  const reserveSlotForAdd = showAddButton && onAddNew

  // Limit displayed items (reserve one slot for + button if needed)
  const maxItems = reserveSlotForAdd ? maxDisplay - 1 : maxDisplay
  const displayItems = items.slice(0, maxItems)

  // Calculate empty slots (excluding the + button slot)
  const totalSlots = cols * rows
  const usedSlots = displayItems.length + (reserveSlotForAdd ? 1 : 0)
  const emptySlots = Math.max(0, totalSlots - usedSlots)

  const getItemStatus = (itemId: number): ActiveEquipment | undefined => {
    return activeItems.find((a) => a.id === itemId)
  }

  const handleClick = (item: EquipmentItem) => {
    if (!editable) return

    const current = getItemStatus(item.id)

    // Cycle: off → easier → harder → off
    if (!current) {
      onToggle(item.id, "easier")
    } else if (current.effect === "easier") {
      onToggle(item.id, "harder")
    } else if (current.effect === "harder") {
      onToggle(item.id, null) // Turn off
    } else {
      onToggle(item.id, "easier")
    }
  }

  const getSlotStyle = (status: ActiveEquipment | undefined) => {
    if (!status) {
      return "bg-gray-700/50 border-gray-600"
    }
    if (status.effect === "easier") {
      return "bg-green-900/50 border-green-500 ring-2 ring-green-400/50"
    }
    if (status.effect === "harder") {
      return "bg-red-900/50 border-red-500 ring-2 ring-red-400/50"
    }
    return "bg-blue-900/50 border-blue-500 ring-2 ring-blue-400/50"
  }

  const getEffectIcon = (status: ActiveEquipment | undefined) => {
    if (!status) return null
    if (status.effect === "easier") return <ChevronDown className="h-3 w-3 text-green-400" />
    if (status.effect === "harder") return <ChevronUp className="h-3 w-3 text-red-400" />
    return <Check className="h-3 w-3 text-blue-400" />
  }

  const getEffectLabel = (status: ActiveEquipment | undefined) => {
    if (!status) return null
    if (status.effect === "easier") return "E"
    if (status.effect === "harder") return "H"
    return "N"
  }

  const formatItemName = (item: EquipmentItem) => {
    const parts = [item.name]
    if (item.value !== null && item.value !== undefined) {
      parts.push(String(item.value))
    }
    if (item.unit && item.unit !== "none" && item.unit !== "level") {
      parts.push(item.unit)
    }
    return parts.join(" ")
  }

  if (items.length === 0) return null

  return (
    <div
      className="flex flex-col items-center origin-center"
      style={{ transform: `scale(${scale})` }}
    >
      <div
        className="p-3 rounded-xl bg-amber-950 border-4 border-amber-800 shadow-lg"
        style={{
          background: "linear-gradient(145deg, #78350f 0%, #451a03 100%)",
        }}
      >
        {/* Backpack top handle */}
        <div className="flex justify-center -mt-5 mb-2">
          <div className="w-12 h-4 bg-amber-800 rounded-b-lg border-x-2 border-b-2 border-amber-900" />
        </div>

        {/* Grid */}
        <div
          className="grid gap-2 p-2 bg-black/30 rounded-lg border border-amber-900/50"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {displayItems.map((item) => {
            const status = getItemStatus(item.id)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleClick(item)}
                disabled={!editable}
                className={`
                  relative w-16 h-16 rounded-lg border-2 transition-all
                  flex flex-col items-center justify-center p-1
                  ${getSlotStyle(status)}
                  ${editable ? "cursor-pointer hover:brightness-110 active:scale-95" : "cursor-default"}
                `}
              >
                {/* Effect badge */}
                {status && (
                  <span
                    className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                      status.effect === "easier"
                        ? "bg-green-500 text-white"
                        : status.effect === "harder"
                        ? "bg-red-500 text-white"
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    {getEffectLabel(status)}
                  </span>
                )}

                {/* Item name */}
                <span
                  className={`text-[10px] font-medium text-center leading-tight ${
                    status ? "text-white" : "text-gray-400"
                  }`}
                >
                  {formatItemName(item)}
                </span>

                {/* Effect icon */}
                {status && (
                  <div className="mt-1">{getEffectIcon(status)}</div>
                )}
              </button>
            )
          })}

          {/* Add new button */}
          {reserveSlotForAdd && (
            <button
              type="button"
              onClick={onAddNew}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-amber-500/50 bg-amber-900/20
                       flex items-center justify-center cursor-pointer hover:bg-amber-800/30
                       hover:border-amber-400 transition-all active:scale-95"
            >
              <span className="text-2xl text-amber-400 font-bold">+</span>
            </button>
          )}

          {/* Empty slots */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-600/50 bg-gray-800/20"
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line">
        {editable ? "Tap to cycle: \noff → easier → harder" : "Equipment"}
      </p>
    </div>
  )
}
