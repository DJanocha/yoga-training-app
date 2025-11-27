"use client"

import { useState, useEffect, useRef, useMemo, type ReactNode } from "react"
import { Search, Filter, Plus, Copy, X, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dock, type DockPrimaryAction } from "./dock"

type ActionBarState = "search" | "filters" | "create" | null

export type ActionBarDockProps = {
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

  // Config
  className?: string
  enableAnimations?: boolean
}

// ============================================================================
// Content Components (rendered in dock's content area)
// ============================================================================

type SearchContentProps = {
  searchQuery: string
  searchPlaceholder: string
  onSearchChange: (query: string) => void
  onClose: () => void
}

function SearchContent({ searchQuery, searchPlaceholder, onSearchChange, onClose }: SearchContentProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Sync local search query when prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery)
  }, [searchQuery])

  // Focus input when mounted
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleSearchSave = () => {
    onSearchChange(localSearchQuery)
    onClose()
  }

  const handleSearchClear = () => {
    setLocalSearchQuery("")
    onSearchChange("")
  }

  return (
    <div className="p-3">
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
            if (e.key === "Escape") onClose()
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
  )
}

type FiltersContentProps = {
  filterContent: ReactNode
  onApplyFilters: () => void
  onClearFilters: () => void
  onClose: () => void
}

function FiltersContent({ filterContent, onApplyFilters, onClearFilters, onClose }: FiltersContentProps) {
  const handleApplyFilters = () => {
    onApplyFilters()
    onClose()
  }

  const handleClearFilters = () => {
    onClearFilters()
    onClose()
  }

  return (
    <div className="p-4 space-y-4">
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
  )
}

type CreateContentProps = {
  createContent: ReactNode
  onSubmitCreate: () => void | Promise<void>
  onAddDetails?: () => void | Promise<void>
  isSubmitting: boolean
  createButtonLabel: string
  addDetailsButtonLabel: string
  onClose: () => void
}

function CreateContent({
  createContent,
  onSubmitCreate,
  onAddDetails,
  isSubmitting,
  createButtonLabel,
  addDetailsButtonLabel,
  onClose,
}: CreateContentProps) {
  const handleSubmitCreate = async () => {
    await onSubmitCreate()
    onClose()
  }

  const handleAddDetails = async () => {
    if (onAddDetails) {
      await onAddDetails()
      onClose()
    }
  }

  return (
    <div className="p-4 space-y-4">
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
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ActionBarDock({
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
  copyDisabledMessage: _copyDisabledMessage = "Select an item to clone",

  // Config
  className,
  enableAnimations = true,
}: ActionBarDockProps) {
  const [activeMode, setActiveMode] = useState<ActionBarState>(null)

  // Sync with external create state control
  useEffect(() => {
    if (isCreateOpen !== undefined) {
      setActiveMode(isCreateOpen ? "create" : null)
    }
  }, [isCreateOpen])

  // Notify parent of create state changes
  const handleModeChange = (mode: ActionBarState) => {
    setActiveMode(mode)
    if (onCreateOpenChange) {
      onCreateOpenChange(mode === "create")
    }
  }

  const handleClose = () => {
    handleModeChange(null)
  }

  const hasFilters = filterContent && onApplyFilters && onClearFilters
  const hasCopy = onCopy !== undefined

  const handleCopy = () => {
    if (selectedItemId && onCopy) {
      onCopy(selectedItemId)
    }
  }

  // Build actions
  const actions = useMemo((): DockPrimaryAction[] => {
    return [
      // Search action
      {
        id: "search",
        icon: Search,
        badge: searchQuery ? "!" : undefined,
        bgClassName: activeMode === "search" ? "bg-primary text-primary-foreground hover:bg-primary/90" : undefined,
        secondaryActions: [],
        content: (
          <SearchContent
            searchQuery={searchQuery}
            searchPlaceholder={searchPlaceholder}
            onSearchChange={onSearchChange}
            onClose={handleClose}
          />
        ),
      },
      // Filters action (conditional)
      ...(hasFilters ? [{
        id: "filters",
        icon: Filter,
        badge: filterCount > 0 ? filterCount : undefined,
        bgClassName: activeMode === "filters" ? "bg-primary text-primary-foreground hover:bg-primary/90" : undefined,
        secondaryActions: [],
        content: (
          <FiltersContent
            filterContent={filterContent}
            onApplyFilters={onApplyFilters}
            onClearFilters={onClearFilters}
            onClose={handleClose}
          />
        ),
      }] : []),
      // Create action
      {
        id: "create",
        icon: activeMode === "create" ? X : Plus,
        bgClassName: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondaryActions: [],
        content: (
          <CreateContent
            createContent={createContent}
            onSubmitCreate={onSubmitCreate}
            onAddDetails={onAddDetails}
            isSubmitting={isSubmitting}
            createButtonLabel={createButtonLabel}
            addDetailsButtonLabel={addDetailsButtonLabel}
            onClose={handleClose}
          />
        ),
      },
      // Copy action (conditional)
      ...(hasCopy ? [{
        id: "copy",
        icon: Copy,
        onClick: handleCopy,
        disabled: !selectedItemId,
        secondaryActions: [],
      }] : []),
    ]
  }, [
    activeMode,
    searchQuery,
    searchPlaceholder,
    onSearchChange,
    hasFilters,
    filterCount,
    filterContent,
    onApplyFilters,
    onClearFilters,
    createContent,
    onSubmitCreate,
    onAddDetails,
    isSubmitting,
    createButtonLabel,
    addDetailsButtonLabel,
    hasCopy,
    selectedItemId,
    onCopy,
    handleClose,
    handleCopy,
  ])

  return (
    <Dock
      actions={actions}
      activeActionId={activeMode}
      onActionActivate={(id) => handleModeChange(id as ActionBarState)}
      className={className}
      enableAnimations={enableAnimations}
    />
  )
}
