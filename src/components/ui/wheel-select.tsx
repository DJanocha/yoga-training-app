import { useRef, useState, useCallback, useEffect, useMemo, forwardRef } from "react"
import { cn } from "@/lib/utils"

export type WheelSelectSize = "default" | "lg"

export type WheelSelectProps<T extends string | number = string> = {
  value: T
  onChange: (value: T) => void
  options: readonly T[]
  className?: string
  formatOption?: (option: T) => string
  /** Size variant - lg for execution screen */
  size?: WheelSelectSize
}

export const WheelSelect = forwardRef(function WheelSelect<T extends string | number = string>(
  { value, onChange, options, className, formatOption = (opt) => String(opt), size = "default" }: WheelSelectProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const isLarge = size === "lg"
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
      const steps = Math.round(deltaY / 16) // 16px = 1 step (faster scrolling)
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
    e.stopPropagation()
    handleDragStart(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    e.preventDefault()
    e.stopPropagation()
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
      e.preventDefault()
      e.stopPropagation()
      handleDragMove(e.clientY)
    }

    const handleGlobalTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      handleDragMove(e.touches[0].clientY)
    }

    const handleGlobalEnd = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      handleDragEnd()
    }

    document.addEventListener("mousemove", handleGlobalMouseMove, { passive: false })
    document.addEventListener("mouseup", handleGlobalEnd, { passive: false })
    document.addEventListener("touchmove", handleGlobalTouchMove, { passive: false })
    document.addEventListener("touchend", handleGlobalEnd, { passive: false })
    document.addEventListener("touchcancel", handleGlobalEnd, { passive: false })

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove)
      document.removeEventListener("mouseup", handleGlobalEnd)
      document.removeEventListener("touchmove", handleGlobalTouchMove)
      document.removeEventListener("touchend", handleGlobalEnd)
      document.removeEventListener("touchcancel", handleGlobalEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // Size-dependent values
  const itemHeight = isLarge ? 48 : 32
  const containerHeight = isLarge ? 192 : 128 // h-48 vs h-32
  const containerWidth = isLarge ? 96 : 80 // w-24 vs w-20
  const centerOffset = isLarge ? 168 : 112 // 3 * itemHeight + itemHeight/2

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
    >
      <div
        className="relative rounded-lg border bg-background overflow-hidden"
        style={{ height: containerHeight, width: containerWidth }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
      >
        {/* Options - with smooth transform animation */}
        <div
          className="absolute w-full transition-transform duration-150 ease-out pointer-events-none"
          style={{
            top: `calc(50% - ${centerOffset}px)`,
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
                  "flex items-center justify-center transition-opacity duration-150 pointer-events-none",
                  isLarge ? "h-12 text-2xl font-medium" : "h-8 text-lg font-medium",
                  isSelected && (isLarge ? "text-4xl font-bold" : "text-2xl font-bold")
                )}
                style={{ opacity: option === null ? 0 : opacity }}
              >
                {option !== null && formatOption(option)}
              </div>
            )
          })}
        </div>

        {/* Selection indicator */}
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-y-2 border-primary/20 bg-primary/5 pointer-events-none"
          style={{ height: itemHeight }}
        />

        {/* Fade edges */}
        <div className={cn(
          "absolute inset-x-0 top-0 bg-linear-to-b from-background to-transparent pointer-events-none",
          isLarge ? "h-16" : "h-12"
        )} />
        <div className={cn(
          "absolute inset-x-0 bottom-0 bg-linear-to-t from-background to-transparent pointer-events-none",
          isLarge ? "h-16" : "h-12"
        )} />
      </div>
    </div>
  )
}) as <T extends string | number = string>(
  props: WheelSelectProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement
