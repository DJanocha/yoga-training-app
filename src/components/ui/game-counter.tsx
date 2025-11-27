"use client"

import { WheelNumberInput } from "./wheel-number-input"

type GameCounterProps = {
  /** Current value */
  value: number
  /** Called when user changes the value */
  onChange?: (value: number) => void
  /** Target value to display */
  target?: number
  /** Label shown below */
  label?: string
  /** Color theme */
  theme?: "lime" | "orange" | "cyan"
  /** Min value */
  min?: number
  /** Max value */
  max?: number
  /** Disabled state - makes the component read-only with visual indication */
  disabled?: boolean
}

/**
 * Game-style scoreboard counter with wheel input
 * Inspired by arcade score displays
 */
export function GameCounter({
  value,
  onChange,
  target,
  label = "Reps",
  theme = "lime",
  min = 0,
  max = 999,
  disabled = false,
}: GameCounterProps) {
  // Theme colors
  const colors = {
    lime: {
      border: "border-lime-500",
      text: "text-lime-400",
      bg: "bg-lime-900/20",
      glow: "shadow-[0_0_15px_rgba(163,230,53,0.3)]",
      targetText: "text-lime-300",
    },
    orange: {
      border: "border-orange-500",
      text: "text-orange-400",
      bg: "bg-orange-900/20",
      glow: "shadow-[0_0_15px_rgba(249,115,22,0.3)]",
      targetText: "text-orange-300",
    },
    cyan: {
      border: "border-cyan-500",
      text: "text-cyan-400",
      bg: "bg-cyan-900/20",
      glow: "shadow-[0_0_15px_rgba(6,182,212,0.3)]",
      targetText: "text-cyan-300",
    },
  }

  const c = colors[theme]

  // Determine if we're at/above target
  const atTarget = target !== undefined && value >= target
  const progressColor = atTarget ? "text-green-400" : c.text

  return (
    <div className={`flex flex-col items-center ${disabled ? 'pointer-events-none' : ''}`}>
      <div
        className={`flex flex-col items-center p-4 rounded-2xl bg-linear-to-br from-gray-900 to-black ${c.border} border-4 ${disabled ? 'opacity-50 grayscale' : c.glow}`}
      >
        {/* Counter wheel */}
        <div className={`relative p-3 rounded-xl bg-gray-800 border-2 border-gray-600`}>
          <WheelNumberInput
            value={value}
            onChange={disabled ? () => {} : (onChange ?? (() => {}))}
            min={min}
            max={max}
            step={1}
            size="lg"
            className={progressColor}
          />
        </div>

        {/* Target indicator */}
        {target !== undefined && (
          <div className={`mt-3 text-center ${c.targetText}`}>
            <span className="text-sm font-medium">
              target: <span className="font-bold">{target}</span>
            </span>
            {atTarget && (
              <span className="ml-2 text-green-400 text-sm">✓</span>
            )}
          </div>
        )}
      </div>
      <p className={`text-sm ${c.text} mt-3 font-semibold uppercase tracking-wide`}>
        {label}
      </p>
    </div>
  )
}
