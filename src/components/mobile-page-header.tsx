import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MobilePageHeaderProps {
  title: string
  onAdd?: () => void
  onSearch?: () => void
  className?: string
}

export function MobilePageHeader({
  title,
  onAdd,
  onSearch,
  className,
}: MobilePageHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between py-4 md:hidden',
        className
      )}
    >
      <h1 className="text-2xl font-bold">{title}</h1>

      <div className="flex items-center gap-1">
        {onSearch && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSearch}
            className="h-9 w-9"
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
        )}
        {onAdd && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onAdd}
            className="h-9 w-9"
          >
            <Plus className="h-5 w-5" />
            <span className="sr-only">Add</span>
          </Button>
        )}
      </div>
    </header>
  )
}
