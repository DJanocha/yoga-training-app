import { useRef, useState, useCallback, useEffect, useMemo, forwardRef } from "react"
import { cn } from "@/lib/utils"

export type WheelSelectProps<T extends string | number = string> = {
  value: T
  onChange: (value: T) => void
  options: readonly T[]
  className?: string
  formatOption?: (option: T) => string
}

export const WheelSelect = forwardRef(function WheelSelect<T extends string | number = string>(
  { value, onChange, options, className, formatOption = (opt) => String(opt) }: WheelSelectProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const internalRef = useRef<HTMLDivElement>(null)
  const containerRef = (ref as React.RefObject<HTMLDivElement>) || internalRef
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [offset, setOffset] = useState(0)

  // Use ref for startIndex to avoid stale closures
  const startIndexRef = useRef(0)

  // Find current value index
  const currentIndex = options.indexOf(value)

  // Generate visible options (current ± 3)
  const visibleOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const index = currentIndex + (i - 3)
      return index >= 0 && index < options.length ? options[index] : null
    })
  }, [currentIndex, options])

  // Handle wheel/scroll event
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const delta = e.deltaY > 0 ? 1 : -1
      const newIndex = Math.max(0, Math.min(options.length - 1, currentIndex + delta))

      if (newIndex !== currentIndex) {
        setOffset(delta > 0 ? -1 : 1)
        setTimeout(() => setOffset(0), 50)
        onChange(options[newIndex])
      }
    },
    [currentIndex, options, onChange]
  )

  // Handle drag start
  const handleDragStart = useCallback(
    (clientY: number) => {
      setIsDragging(true)
      setStartY(clientY)
      startIndexRef.current = currentIndex
    },
    [currentIndex]
  )

  // Handle drag move
  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!isDragging) return

      const deltaY = startY - clientY
      const steps = Math.round(deltaY / 20) // 20px = 1 step
      const newIndex = Math.max(0, Math.min(options.length - 1, startIndexRef.current + steps))

      if (newIndex !== currentIndex) {
        onChange(options[newIndex])
      }
    },
    [isDragging, startY, options, currentIndex, onChange]
  )

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleDragStart(e.clientY)
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    handleDragStart(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    handleDragMove(e.touches[0].clientY)
  }

  // Add wheel listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("wheel", handleWheel, { passive: false })
    return () => container.removeEventListener("wheel", handleWheel)
  }, [handleWheel, containerRef])

  // Add global mouse/touch listeners when dragging
  useEffect(() => {
    if (!isDragging) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY)
    }

    const handleGlobalTouchMove = (e: TouchEvent) => {
      handleDragMove(e.touches[0].clientY)
    }

    document.addEventListener("mousemove", handleGlobalMouseMove)
    document.addEventListener("mouseup", handleDragEnd)
    document.addEventListener("touchmove", handleGlobalTouchMove)
    document.addEventListener("touchend", handleDragEnd)

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove)
      document.removeEventListener("mouseup", handleDragEnd)
      document.removeEventListener("touchmove", handleGlobalTouchMove)
      document.removeEventListener("touchend", handleDragEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  const itemHeight = 32 // h-8 = 32px

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative select-none touch-none",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        className
      )}
      tabIndex={0}
      role="listbox"
      aria-label="Option picker"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleDragEnd}
    >
      <div className="relative h-32 w-20 rounded-lg border bg-background overflow-hidden">
        {/* Options - with smooth transform animation */}
        <div
          className="absolute w-full transition-transform duration-150 ease-out"
          style={{
            // Position so that index 3 (4th item) is centered
            top: 'calc(50% - 112px)', // 50% - (3 * 32px + 16px)
            transform: `translateY(${offset * itemHeight}px)`
          }}
        >
          {visibleOptions.map((option, index) => {
            const isSelected = index === 3
            const distance = Math.abs(index - 3)
            const opacity = 1 - distance * 0.25

            return (
              <div
                key={`${option}-${index}`}
                className={cn(
                  "h-8 flex items-center justify-center transition-opacity duration-150",
                  "text-lg font-medium",
                  isSelected && "text-2xl font-bold"
                )}
                style={{ opacity: option === null ? 0 : opacity }}
              >
                {option !== null && formatOption(option)}
              </div>
            )
          })}
        </div>

        {/* Selection indicator */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 border-y-2 border-primary/20 bg-primary/5 pointer-events-none" />

        {/* Fade edges */}
        <div className="absolute inset-x-0 top-0 h-12 bg-linear-to-b from-background to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-background to-transparent pointer-events-none" />
      </div>
    </div>
  )
}) as <T extends string | number = string>(
  props: WheelSelectProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement
