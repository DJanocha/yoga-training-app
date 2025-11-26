import { forwardRef, useMemo } from "react"
import { WheelSelect } from "./wheel-select"

export type WheelNumberInputProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

/**
 * Generates an array of numbers from min to max with the given step
 * @example rangeToOptions(1, 5, 2) => [1, 3, 5]
 */
export function rangeToOptions(min: number, max: number, step: number): number[] {
  const options: number[] = []
  for (let i = min; i <= max; i += step) {
    options.push(i)
  }
  return options
}

export const WheelNumberInput = forwardRef<HTMLDivElement, WheelNumberInputProps>(
  function WheelNumberInput(
    { value, onChange, min = 1, max = 999, step = 1, className },
    ref
  ) {
    // Generate number options from range
    const options = useMemo(() => rangeToOptions(min, max, step), [min, max, step])

    // Format numbers with 2-digit padding
    const formatNumber = (num: number) => String(num).padStart(2, "0")

    return (
      <WheelSelect
        ref={ref}
        value={value}
        onChange={onChange}
        options={options}
        formatOption={formatNumber}
        className={className}
      />
    )
  }
)
