import { cn } from '@/lib/utils'

interface FilterOption {
  value: string
  label: string
}

interface FilterChipsProps {
  options: FilterOption[]
  selected: string
  onSelect: (value: string) => void
  className?: string
}

export function FilterChips({
  options,
  selected,
  onSelect,
  className,
}: FilterChipsProps) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-2 scrollbar-hide',
        className
      )}
    >
      {options.map((option) => {
        const isSelected = selected === option.value
        return (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
