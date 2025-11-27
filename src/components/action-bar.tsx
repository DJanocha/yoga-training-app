"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { Search, Filter, Plus, Copy, X, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ActionBarState = "base" | "search" | "filters" | "create"

type ActionBarProps = {
  // Search
  searchQuery: string
  onSearchChange: (query: string) => void
  searchPlaceholder?: string

  // Filters (optional - hide filter button if not provided)
  filterCount?: number
  filterContent?: ReactNode
  onApplyFilters?: () => void
  onClearFilters?: () => void

  // Create
  createTitle?: string
  createContent: ReactNode
  onSubmitCreate: () => void | Promise<void>
  onAddDetails?: () => void | Promise<void>
  isSubmitting?: boolean
  createButtonLabel?: string
  addDetailsButtonLabel?: string

  // External control for create state
  isCreateOpen?: boolean
  onCreateOpenChange?: (open: boolean) => void

  // Copy/Clone (optional - hide copy button if not provided)
  selectedItemId?: string
  onCopy?: (itemId: string) => void
  copyDisabledMessage?: string
}

export function ActionBar({
  // Search
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Type to search...",

  // Filters
  filterCount = 0,
  filterContent,
  onApplyFilters,
  onClearFilters,

  // Create
  createTitle: _createTitle = "Create New",
  createContent,
  onSubmitCreate,
  onAddDetails,
  isSubmitting = false,
  createButtonLabel = "Create",
  addDetailsButtonLabel = "Add details",

  // External control
  isCreateOpen,
  onCreateOpenChange,

  // Copy
  selectedItemId,
  onCopy,
  copyDisabledMessage = "Select an item to clone",
}: ActionBarProps) {
  const [state, setState] = useState<ActionBarState>("base")
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Sync with external create state control
  useEffect(() => {
    if (isCreateOpen !== undefined) {
      setState(isCreateOpen ? "create" : "base")
    }
  }, [isCreateOpen])

  // Notify parent of create state changes
  const handleStateChange = (newState: ActionBarState) => {
    setState(newState)
    if (onCreateOpenChange) {
      onCreateOpenChange(newState === "create")
    }
  }

  // Sync local search query when prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery)
  }, [searchQuery])

  // Scroll to search input when search state is activated
  useEffect(() => {
    if (state === "search" && searchInputRef.current) {
      // Small delay to allow animation to start before scrolling
      requestAnimationFrame(() => {
        searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      })
    }
  }, [state])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node

      // Don't collapse if clicking inside the container
      if (containerRef.current && containerRef.current.contains(target)) {
        return
      }

      // Don't collapse if clicking inside a Radix portal (Select dropdown, Dialog, etc.)
      // Radix portals are rendered with data-radix-popper-content-wrapper or inside [data-radix-portal]
      const isInsideRadixPortal =
        (target as Element).closest?.('[data-radix-popper-content-wrapper]') ||
        (target as Element).closest?.('[data-radix-portal]') ||
        (target as Element).closest?.('[role="listbox"]') ||
        (target as Element).closest?.('[role="dialog"]')

      if (isInsideRadixPortal) {
        return
      }

      handleStateChange("base")
    }

    if (state !== "base") {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [state, handleStateChange])

  const handleSearchSave = () => {
    onSearchChange(localSearchQuery)
    handleStateChange("base")
  }

  const handleSearchClear = () => {
    setLocalSearchQuery("")
    onSearchChange("")
  }

  const handleCopy = () => {
    if (selectedItemId && onCopy) {
      onCopy(selectedItemId)
    }
  }

  const handleApplyFilters = () => {
    if (onApplyFilters) onApplyFilters()
    handleStateChange("base")
  }

  const handleClearFilters = () => {
    if (onClearFilters) onClearFilters()
    handleStateChange("base")
  }

  const hasFilters = filterContent && onApplyFilters && onClearFilters
  const hasCopy = onCopy !== undefined

  const handleSubmitCreate = async () => {
    await onSubmitCreate()
    handleStateChange("base")
  }

  const handleAddDetails = async () => {
    if (onAddDetails) {
      await onAddDetails()
      handleStateChange("base")
    }
  }

  return (
    <div className="bg-background px-4 pb-4 pt-2" ref={containerRef}>
      <div
        className={cn(
          "bg-card border border-border rounded-3xl shadow-lg overflow-hidden",
          "grid transition-all duration-300 ease-out",
          state === "base" && "grid-rows-[0fr_56px]",
          state === "search" && "grid-rows-[1fr_56px]",
          state === "filters" && "grid-rows-[1fr_56px]",
          state === "create" && "grid-rows-[1fr_56px]",
        )}
      >
        {/* Expanded Content Area */}
        <div className="overflow-hidden">
          <div
            className={cn(
              "px-4 pt-4 pb-2 transition-opacity duration-200",
              state === "base" ? "opacity-0" : "opacity-100",
            )}
          >
            {/* Search State */}
            {state === "search" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    ref={searchInputRef}
                    placeholder={searchPlaceholder}
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    className="flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearchSave()
                      if (e.key === "Escape") handleStateChange("base")
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSearchClear}
                    className="shrink-0 h-10 w-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="default"
                    onClick={handleSearchSave}
                    className="shrink-0 h-10 w-10"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Filters State */}
            {state === "filters" && hasFilters && (
              <div className="space-y-4">
                {filterContent}
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={handleApplyFilters}>
                    Apply Filters
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={handleClearFilters}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Create State */}
            {state === "create" && (
              <div className="space-y-4">
                {createContent}
                <div className="flex flex-col gap-2 pt-2">
                  {/* Primary action */}
                  <Button
                    className="w-full"
                    onClick={handleSubmitCreate}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : createButtonLabel}
                  </Button>
                  {/* Secondary actions */}
                  <div className="flex gap-2">
                    {onAddDetails && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleAddDetails}
                        disabled={isSubmitting}
                      >
                        {addDetailsButtonLabel}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className={onAddDetails ? "flex-1" : "w-full"}
                      onClick={() => handleStateChange("base")}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Icon Bar */}
        <div className="px-3 h-14 flex items-center justify-around gap-2">
          {/* Search Icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleStateChange(state === "search" ? "base" : "search")}
            className={cn(
              "relative h-10 w-10 rounded-full transition-colors duration-200",
              state === "search"
                ? "text-foreground hover:bg-muted"
                : state !== "base"
                  ? "text-muted-foreground hover:bg-muted"
                  : "text-foreground hover:bg-muted",
            )}
          >
            <Search className="h-5 w-5" />
            {searchQuery && state === "base" && (
              <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] px-1.5 h-4 rounded-full max-w-[70px] truncate">
                {searchQuery.length > 8 ? searchQuery.slice(0, 8) + "..." : searchQuery}
              </Badge>
            )}
          </Button>

          {/* Filter Icon - only show if filters are configured */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleStateChange(state === "filters" ? "base" : "filters")}
              className={cn(
                "relative h-10 w-10 rounded-full transition-colors duration-200",
                state === "filters"
                  ? "text-foreground hover:bg-muted"
                  : state !== "base"
                    ? "text-muted-foreground hover:bg-muted"
                    : "text-foreground hover:bg-muted",
              )}
            >
              <Filter className="h-5 w-5" />
              {filterCount > 0 && state === "base" && (
                <Badge className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full">
                  {filterCount}
                </Badge>
              )}
            </Button>
          )}

          {/* Plus/Create Icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleStateChange(state === "create" ? "base" : "create")}
            className={cn(
              "h-10 w-10 rounded-full transition-colors duration-200",
              state === "create"
                ? "text-foreground hover:bg-muted"
                : state !== "base"
                  ? "text-muted-foreground hover:bg-muted"
                  : "text-foreground hover:bg-muted",
            )}
          >
            <Plus className="h-5 w-5" />
          </Button>

          {/* Copy/Clone Icon - only show if copy is configured */}
          {hasCopy && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              disabled={!selectedItemId}
              title={!selectedItemId ? copyDisabledMessage : "Clone item"}
              className={cn(
                "h-10 w-10 rounded-full transition-colors duration-200",
                !selectedItemId
                  ? "text-muted-foreground/50 cursor-not-allowed"
                  : state !== "base"
                    ? "text-muted-foreground hover:bg-muted"
                    : "text-foreground hover:bg-muted",
              )}
            >
              <Copy className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
