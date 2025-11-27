"use client"

import { WheelNumberInput } from "./wheel-number-input"

type GameTimerProps = {
  /** Total seconds elapsed or remaining */
  seconds: number
  /** Called when user changes the time via wheels */
  onChange?: (totalSeconds: number) => void
  /** Whether the timer is editable (wheels active) or display-only */
  editable?: boolean
  /** Label shown below the timer */
  label?: string
  /** Color theme */
  theme?: "emerald" | "orange" | "blue"
}

/**
 * Game-style digital timer with minute:second wheels
 * Inspired by minimalist digital clock design
 */
export function GameTimer({
  seconds,
  onChange,
  editable = false,
  label = "Time",
  theme = "emerald",
}: GameTimerProps) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60

  const handleMinutesChange = (newMinutes: number) => {
    onChange?.(newMinutes * 60 + secs)
  }

  const handleSecondsChange = (newSecs: number) => {
    onChange?.(minutes * 60 + newSecs)
  }

  // Theme colors
  const colors = {
    emerald: {
      border: "border-emerald-500",
      text: "text-emerald-400",
      bg: "bg-emerald-900/20",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]",
    },
    orange: {
      border: "border-orange-500",
      text: "text-orange-400",
      bg: "bg-orange-900/20",
      glow: "shadow-[0_0_15px_rgba(249,115,22,0.3)]",
    },
    blue: {
      border: "border-blue-500",
      text: "text-blue-400",
      bg: "bg-blue-900/20",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
    },
  }

  const c = colors[theme]

  // Format for display-only mode
  const formatTime = (val: number) => String(val).padStart(2, "0")

  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex items-center justify-center gap-1 p-3 rounded-xl bg-black ${c.border} border-2 ${c.glow}`}
      >
        <div className={`flex items-center ${c.text}`}>
          {/* Minutes */}
          <div className="relative">
            <div
              className={`relative rounded-lg bg-zinc-800 overflow-hidden flex items-center justify-center`}
              style={{ height: "96px", width: "56px" }}
            >
              {editable ? (
                <WheelNumberInput
                  value={minutes}
                  onChange={handleMinutesChange}
                  min={0}
                  max={59}
                  step={1}
                  className={c.text}
                  variant="dark"
                />
              ) : (
                <span className="text-5xl font-bold font-mono">
                  {formatTime(minutes)}
                </span>
              )}
            </div>
          </div>

          <span className="text-5xl font-bold mx-2">:</span>

          {/* Seconds */}
          <div className="relative">
            <div
              className={`relative rounded-lg bg-zinc-800 overflow-hidden flex items-center justify-center`}
              style={{ height: "96px", width: "56px" }}
            >
              {editable ? (
                <WheelNumberInput
                  value={secs}
                  onChange={handleSecondsChange}
                  min={0}
                  max={59}
                  step={1}
                  className={c.text}
                  variant="dark"
                />
              ) : (
                <span className="text-5xl font-bold font-mono">
                  {formatTime(secs)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className={`text-sm ${c.text} mt-3 font-medium`}>{label}</p>
    </div>
  )
}
