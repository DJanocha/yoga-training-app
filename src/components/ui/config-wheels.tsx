"use client"

import { WheelNumberInput } from "./wheel-number-input"
import { WheelSelect } from "./wheel-select"

type ConfigWheelsProps = {
  /** Current numeric value */
  value: number
  /** Called when value changes */
  onValueChange: (value: number) => void
  /** Current measure type */
  measure: "time" | "repetitions"
  /** Called when measure changes */
  onMeasureChange: (measure: "time" | "repetitions") => void
  /** Label shown below */
  label?: string
  /** Theme color */
  theme?: "amber" | "emerald" | "blue"
}

/**
 * Game-style config wheels for value + measure selection
 * Used in sequence builder for default exercise config
 */
export function ConfigWheels({
  value,
  onValueChange,
  measure,
  onMeasureChange,
  label = "Default Config",
  theme = "amber",
}: ConfigWheelsProps) {
  // Dynamic min/max/step based on measure type
  const min = 1
  const max = measure === "time" ? 300 : 100
  const step = measure === "time" ? 5 : 1

  // Theme colors
  const colors = {
    amber: {
      border: "border-amber-500",
      text: "text-amber-400",
      glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
    },
    emerald: {
      border: "border-emerald-500",
      text: "text-emerald-400",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]",
    },
    blue: {
      border: "border-blue-500",
      text: "text-blue-400",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
    },
  }

  const c = colors[theme]

  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex items-center gap-4 p-4 rounded-xl bg-black ${c.border} border-2 ${c.glow}`}
      >
        {/* Value Wheel */}
        <div className="flex flex-col items-center">
          <WheelNumberInput
            value={value}
            onChange={onValueChange}
            min={min}
            max={max}
            step={step}
          />
          <p className={`text-xs ${c.text} mt-2 font-medium`}>Value</p>
        </div>

        {/* Measure Wheel */}
        <div className="flex flex-col items-center">
          <WheelSelect
            value={measure}
            onChange={onMeasureChange}
            options={["time", "repetitions"] as const}
            formatOption={(opt) => (opt === "time" ? "sec" : "reps")}
          />
          <p className={`text-xs ${c.text} mt-2 font-medium`}>Unit</p>
        </div>
      </div>
      <p className={`text-sm ${c.text} mt-3 font-medium`}>{label}</p>
    </div>
  )
}
