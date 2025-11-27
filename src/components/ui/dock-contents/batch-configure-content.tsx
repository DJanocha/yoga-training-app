"use client"

import { useState, useEffect } from "react"
import { WheelNumberInput } from "@/components/ui/wheel-number-input"
import { WheelSelect } from "@/components/ui/wheel-select"
import { Backpack, type BackpackItem, type ActiveItem } from "@/components/ui/backpack"
import type { MeasureType, ModifierEffect } from "@/db/types"

export type ModifierItem = {
  id: number
  name: string
  value?: number | null
  unit?: string | null
}

export type ModifierAssignment = {
  modifierId: number
  effect: ModifierEffect
}

export type BatchConfigValues = {
  measure: MeasureType
  targetValue: number
  modifiers: ModifierAssignment[]
}

type BatchConfigureContentProps = {
  selectedCount: number
  modifiers: ModifierItem[]
  onApply: (config: BatchConfigValues) => void
  onClose: () => void
}

export function BatchConfigureContent({
  selectedCount,
  modifiers,
  onApply,
  onClose,
}: BatchConfigureContentProps) {
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
            <Backpack.Label className="mb-2">Mods</Backpack.Label>
            <Backpack.Container theme="brown">
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
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          Apply to {selectedCount} Selected
        </button>
      </div>
    </>
  )
}
