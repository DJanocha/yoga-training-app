import { useState } from 'react'
import { Package2, Pencil, Trash2 } from 'lucide-react'
import { useTRPC } from '@/lib/trpc'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { EmptyState } from '@/components/empty-state'
import { ActionBarDock as ActionBar } from '@/components/ui/action-bar-dock'
import { useAppForm } from '@/hooks/form'
import { modifierLabelOverrides, modifierRequiredDefaults, modifierUnitOptions, getFieldLabel } from '@/lib/form-utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Modifier } from '@/validators/entities'
import type { ModifierUnit } from '@/db/types'


export function ModifierList() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Edit dialog state
  const [editingModifier, setEditingModifier] = useState<Modifier | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editValue, setEditValue] = useState<number | undefined>(undefined)

  // Delete dialog state
  const [deletingModifier, setDeletingModifier] = useState<Modifier | null>(null)

  // Mutations
  const createModifier = useMutation(trpc.modifiers.create.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.modifiers.list.queryKey() })
    },
  }))

  const updateModifier = useMutation(trpc.modifiers.update.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.modifiers.list.queryKey() })
      setEditingModifier(null)
    },
  }))

  const deleteModifier = useMutation(trpc.modifiers.delete.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.modifiers.list.queryKey() })
      setDeletingModifier(null)
    },
  }))

  // Quick create form using TanStack Form
  const form = useAppForm({
    defaultValues: modifierRequiredDefaults,
  })

  const { data: modifiers, isLoading } = useQuery(trpc.modifiers.list.queryOptions())

  // Filter modifiers by search query
  const filteredModifiers = modifiers?.filter((modifier) =>
    modifier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    modifier.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? []


  const openEditDialog = (modifier: Modifier) => {
    setEditingModifier(modifier)
    setEditName(modifier.name)
    setEditDescription(modifier.description ?? '')
    setEditUnit(modifier.unit ?? '')
    setEditValue(modifier.value ?? undefined)
  }

  const handleSaveEdit = async () => {
    if (!editingModifier || !editName.trim()) return

    await updateModifier.mutateAsync({
      id: editingModifier.id,
      name: editName,
      description: editDescription || undefined,
      unit: (editUnit || undefined) as ModifierUnit | undefined,
      value: editValue,
    })
  }

  const handleDelete = async () => {
    if (!deletingModifier) return
    await deleteModifier.mutateAsync({ id: deletingModifier.id })
  }

  // Handle quick create - creates modifier with name, unit, and value
  const handleQuickCreate = async () => {
    await form.validate('submit')
    if (!form.state.isValid) return

    const { name, unit, value } = form.state.values
    if (!name.trim()) return

    await createModifier.mutateAsync({
      name,
      unit: (unit || undefined) as ModifierUnit | undefined,
      value: value || undefined,
    })
    form.reset()
  }

  // Handle add details - creates modifier then opens edit dialog
  const handleAddDetails = async () => {
    await form.validate('submit')
    if (!form.state.isValid) return

    const { name, unit, value } = form.state.values
    if (!name.trim()) return

    const newModifier = await createModifier.mutateAsync({
      name,
      unit: (unit || undefined) as ModifierUnit | undefined,
      value: value || undefined,
    })
    form.reset()
    if (newModifier) {
      openEditDialog(newModifier)
    }
  }

  if (isLoading || !modifiers) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  // Create content for ActionBar using TanStack Form
  const createContent = (
    <form.AppForm>
      <div className="space-y-4">
        <form.AppField name="name">
          {(field) => (
            <field.TextField
              label={getFieldLabel('name', modifierLabelOverrides)}
              placeholder="e.g., Resistance Band, Yoga Block, Dumbbell"
            />
          )}
        </form.AppField>
        <div className="grid grid-cols-2 gap-3">
          <form.AppField name="unit">
            {(field) => (
              <field.Select
                label="Unit"
                placeholder="Select unit"
                values={modifierUnitOptions}
              />
            )}
          </form.AppField>
          <form.AppField name="value">
            {(field) => (
              <field.NumberInput
                label="Value"
                placeholder="e.g., 5"
              />
            )}
          </form.AppField>
        </div>
      </div>
    </form.AppForm>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border md:hidden">
        <h1 className="text-2xl font-bold">Modifiers</h1>
      </header>

      {/* Desktop Header */}
      <div className="hidden md:block mb-6 p-4">
        <h1 className="text-3xl font-bold">Modifiers</h1>
        <p className="text-muted-foreground">Manage your equipment and workout modifiers (bands, blocks, weights)</p>
      </div>

      {/* Main content - scrollable */}
      <main className="flex-1 overflow-y-auto p-4 pb-32 md:pb-4">
        {filteredModifiers.length === 0 ? (
          searchQuery ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No modifiers match your search.</p>
            </div>
          ) : (
            <EmptyState
              icon={Package2}
              title="No modifiers yet"
              description="Add equipment like resistance bands, yoga blocks, or weights to track their usage in workouts."
              actionLabel="+ Add Modifier"
              onAction={() => {
                // Focus on the create input
              }}
            />
          )
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredModifiers.map((modifier) => (
              <div
                key={modifier.id}
                className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">
                      {[
                        modifier.name,
                        modifier.value !== null && modifier.value !== undefined ? modifier.value : null,
                        modifier.unit && modifier.unit !== 'none' ? modifier.unit : null,
                      ].filter(Boolean).join(' ')}
                    </h3>
                    {modifier.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {modifier.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(modifier)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeletingModifier(modifier)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Action Bar - fixed at bottom on mobile */}
      <div className="fixed bottom-14 left-0 right-0 z-40 md:static md:mt-4">
        <ActionBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search modifiers..."
          createContent={createContent}
          onSubmitCreate={handleQuickCreate}
          onAddDetails={handleAddDetails}
          isSubmitting={createModifier.isPending}
        />
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingModifier} onOpenChange={(open: boolean) => !open && setEditingModifier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Modifier</DialogTitle>
            <DialogDescription>
              Update the details of this modifier/equipment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g., Resistance Band"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unit">Unit</Label>
              <Select value={editUnit} onValueChange={setEditUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No unit</SelectItem>
                  {modifierUnitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-value">Value</Label>
              <Input
                id="edit-value"
                type="number"
                min={0}
                value={editValue ?? ''}
                onChange={(e) => setEditValue(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                placeholder="e.g., 5, 10, 15"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingModifier(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateModifier.isPending}>
              {updateModifier.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingModifier} onOpenChange={(open) => !open && setDeletingModifier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Modifier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingModifier?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteModifier.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
