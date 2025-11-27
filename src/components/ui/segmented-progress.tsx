"use client"

import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./button"
import { useRef, useEffect } from "react"

export type ExerciseStatus = "completed" | "skipped" | "current" | "pending"

export type SegmentedProgressProps = {
  /** Total number of exercises */
  totalExercises: number
  /** Index of the current exercise (0-based) */
  currentIndex: number
  /** Index being viewed in review mode (null if not reviewing) */
  viewingIndex: number | null
  /** Callback when user navigates to a segment */
  onNavigate: (index: number) => void
  /** Function to get status for each exercise index */
  getExerciseStatus: (index: number) => ExerciseStatus
  /** Optional class name */
  className?: string
}

export function SegmentedProgress({
  totalExercises,
  currentIndex,
  viewingIndex,
  onNavigate,
  getExerciseStatus,
  className,
}: SegmentedProgressProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const activeSegmentRef = useRef<HTMLButtonElement>(null)

  // Auto-scroll to keep current/viewing segment visible
  useEffect(() => {
    if (activeSegmentRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const segment = activeSegmentRef.current
      const containerRect = container.getBoundingClientRect()
      const segmentRect = segment.getBoundingClientRect()

      // Check if segment is outside visible area
      if (segmentRect.left < containerRect.left || segmentRect.right > containerRect.right) {
        segment.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
      }
    }
  }, [currentIndex, viewingIndex])

  const displayIndex = viewingIndex ?? currentIndex

  const handlePrev = () => {
    if (displayIndex > 0) {
      onNavigate(displayIndex - 1)
    }
  }

  const handleNext = () => {
    // Can only go forward up to currentIndex (can't skip ahead)
    if (displayIndex < currentIndex) {
      onNavigate(displayIndex + 1)
    }
  }

  const getSegmentColor = (index: number, status: ExerciseStatus): string => {
    const isViewing = viewingIndex === index
    const isCurrent = index === currentIndex && viewingIndex === null

    // Viewing segment (in review mode)
    if (isViewing) {
      return "bg-blue-500 ring-2 ring-blue-300 ring-offset-1"
    }

    // Current active segment (not in review mode)
    if (isCurrent) {
      return "bg-blue-500 ring-2 ring-blue-300 ring-offset-1"
    }

    // Status-based colors
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "skipped":
        return "bg-gray-400"
      case "pending":
        return "bg-muted border border-border"
      default:
        return "bg-muted"
    }
  }

  // Calculate segment width based on total exercises
  // More exercises = smaller segments, but maintain minimum touch target
  const getSegmentWidth = (): string => {
    if (totalExercises <= 10) return "w-8 md:w-10"
    if (totalExercises <= 20) return "w-6 md:w-8"
    if (totalExercises <= 30) return "w-5 md:w-6"
    return "w-4 md:w-5" // Very long sequences
  }

  return (
    <div className={cn("flex items-center gap-2 px-2 py-3", className)}>
      {/* Left arrow */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrev}
        disabled={displayIndex === 0}
        className="h-8 w-8 shrink-0"
        aria-label="Previous exercise"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Segments container with horizontal scroll */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex items-center gap-1 min-w-max px-1">
          {Array.from({ length: totalExercises }, (_, index) => {
            const status = getExerciseStatus(index)
            const isActive = index === displayIndex
            const canNavigate = index <= currentIndex // Can only navigate to current or past exercises

            return (
              <button
                key={index}
                ref={isActive ? activeSegmentRef : null}
                type="button"
                onClick={() => canNavigate && onNavigate(index)}
                disabled={!canNavigate}
                className={cn(
                  "h-3 md:h-4 rounded-full transition-all duration-200",
                  getSegmentWidth(),
                  getSegmentColor(index, status),
                  canNavigate ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed opacity-60",
                  isActive && "scale-110"
                )}
                aria-label={`Exercise ${index + 1}: ${status}`}
                aria-current={isActive ? "step" : undefined}
              />
            )
          })}
        </div>
      </div>

      {/* Right arrow */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        disabled={displayIndex >= currentIndex}
        className="h-8 w-8 shrink-0"
        aria-label="Next exercise"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
