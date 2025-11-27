"use client"

import { Waves, PenLine } from "lucide-react"
import { cn } from "@/lib/utils"

type SequenceType = "strict" | "elastic"

type SequenceTypeSelectorProps = {
  /** Currently selected type */
  value: SequenceType
  /** Called when type changes */
  onChange: (value: SequenceType) => void
  /** Size variant */
  size?: "sm" | "md"
  /** Additional class name */
  className?: string
}

const sizes = {
  sm: {
    padding: "p-3",
    icon: "h-6 w-6",
    title: "text-sm",
    description: "text-[10px] leading-tight",
    gap: "gap-2",
  },
  md: {
    padding: "p-4",
    icon: "h-8 w-8",
    title: "text-base",
    description: "text-xs",
    gap: "gap-2",
  },
} as const
/**
 * Sequence type selector with Flow (strict) and Track (elastic) cards
 * - Flow (cyan): Hands-free, auto-advance - for yoga, stretching, intervals
 * - Track (orange): Interactive, log your reps - for calisthenics, gym
 */
export function SequenceTypeSelector({
  value,
  onChange,
  size = "md",
  className,
}: SequenceTypeSelectorProps) {

  const s = sizes[size]

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {/* Flow Card - Cyan theme */}
      <button
        type="button"
        onClick={() => onChange("strict")}
        className={cn(
          "flex flex-col items-center rounded-xl border-2 transition-all",
          s.padding,
          s.gap,
          value === "strict"
            ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
            : "border-border bg-card hover:border-cyan-500/50 hover:bg-cyan-500/5"
        )}
      >
        <Waves
          className={cn(
            s.icon,
            value === "strict" ? "text-cyan-500" : "text-muted-foreground"
          )}
        />
        <span
          className={cn(
            "font-semibold",
            s.title,
            value === "strict" ? "text-cyan-500" : "text-foreground"
          )}
        >
          Flow
        </span>
        <span className={cn("text-muted-foreground text-center", s.description)}>
          Hands-free
          <br />
          Auto-advance
        </span>
      </button>

      {/* Track Card - Orange theme */}
      <button
        type="button"
        onClick={() => onChange("elastic")}
        className={cn(
          "flex flex-col items-center rounded-xl border-2 transition-all",
          s.padding,
          s.gap,
          value === "elastic"
            ? "border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/30"
            : "border-border bg-card hover:border-orange-500/50 hover:bg-orange-500/5"
        )}
      >
        <PenLine
          className={cn(
            s.icon,
            value === "elastic" ? "text-orange-500" : "text-muted-foreground"
          )}
        />
        <span
          className={cn(
            "font-semibold",
            s.title,
            value === "elastic" ? "text-orange-500" : "text-foreground"
          )}
        >
          Track
        </span>
        <span className={cn("text-muted-foreground text-center", s.description)}>
          Interactive
          <br />
          Log your reps
        </span>
      </button>
    </div>
  )
}
