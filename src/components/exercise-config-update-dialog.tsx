import { useState, useMemo } from 'react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { SequenceExercise, ExerciseGroup, MeasureType } from '@/db/types'

/**
 * Scope options for applying config changes
 */
export type UpdateScope =
  | 'this-only'        // Just this occurrence
  | 'same-group'       // All in same group (if grouped)
  | 'all-in-sequence'  // All occurrences of this exercise in sequence
  | 'same-config'      // All with identical config

type ExerciseConfigChange = {
  measure?: MeasureType
  targetValue?: number
}

type ExerciseConfigUpdateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise: SequenceExercise
  exerciseIndex: number
  exerciseName: string
  oldConfig: { measure: MeasureType; targetValue?: number }
  newConfig: { measure: MeasureType; targetValue?: number }
  exercises: SequenceExercise[]
  groups?: ExerciseGroup[]
  completedCount: number // Number of already completed exercises (0-indexed)
  onApply: (
    scope: UpdateScope,
    indicesToUpdate: number[],
    newConfig: ExerciseConfigChange,
    persistToSequence: boolean
  ) => void
  onCancel: () => void
}

/**
 * Find indices of exercises matching the given scope
 */
function findMatchingExercises(
  exercises: SequenceExercise[],
  targetExercise: SequenceExercise,
  targetIndex: number,
  scope: UpdateScope,
  groups?: ExerciseGroup[],
  completedCount: number = 0
): number[] {
  // Start from completedCount to skip already completed exercises
  const startIndex = completedCount

  switch (scope) {
    case 'this-only':
      // Only update if not already completed
      return targetIndex >= startIndex ? [targetIndex] : []

    case 'same-group': {
      if (!groups || !targetExercise.id) return [targetIndex]

      // Find the group containing this exercise
      const group = groups.find(g => g.exerciseIds.includes(targetExercise.id!))
      if (!group) return [targetIndex]

      // Find all exercises in the same group that haven't been completed
      return exercises
        .map((ex, i) => ({ ex, i }))
        .filter(({ ex, i }) =>
          i >= startIndex &&
          ex.id &&
          group.exerciseIds.includes(ex.id)
        )
        .map(({ i }) => i)
    }

    case 'all-in-sequence': {
      // Find all occurrences of the same exercise (by exerciseId)
      return exercises
        .map((ex, i) => ({ ex, i }))
        .filter(({ ex, i }) =>
          i >= startIndex &&
          ex.exerciseId === targetExercise.exerciseId
        )
        .map(({ i }) => i)
    }

    case 'same-config': {
      // Find all exercises with the exact same config
      const targetMeasure = targetExercise.config.measure
      const targetValue = targetExercise.config.targetValue

      return exercises
        .map((ex, i) => ({ ex, i }))
        .filter(({ ex, i }) =>
          i >= startIndex &&
          ex.exerciseId === targetExercise.exerciseId &&
          ex.config.measure === targetMeasure &&
          ex.config.targetValue === targetValue
        )
        .map(({ i }) => i)
    }

    default:
      return [targetIndex]
  }
}

/**
 * Format config for display
 */
function formatConfig(config: { measure: MeasureType; targetValue?: number }): string {
  const value = config.targetValue ?? 0
  const unit = config.measure === 'time' ? 's' : 'x'
  return `${value}${unit}`
}

export function ExerciseConfigUpdateDialog({
  open,
  onOpenChange,
  exercise,
  exerciseIndex,
  exerciseName,
  oldConfig,
  newConfig,
  exercises,
  groups,
  completedCount,
  onApply,
  onCancel,
}: ExerciseConfigUpdateDialogProps) {
  const [selectedScope, setSelectedScope] = useState<UpdateScope>('this-only')
  const [persistToSequence, setPersistToSequence] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Calculate matches for each scope
  const scopeMatches = useMemo(() => {
    return {
      'this-only': findMatchingExercises(exercises, exercise, exerciseIndex, 'this-only', groups, completedCount),
      'same-group': findMatchingExercises(exercises, exercise, exerciseIndex, 'same-group', groups, completedCount),
      'all-in-sequence': findMatchingExercises(exercises, exercise, exerciseIndex, 'all-in-sequence', groups, completedCount),
      'same-config': findMatchingExercises(exercises, exercise, exerciseIndex, 'same-config', groups, completedCount),
    }
  }, [exercises, exercise, exerciseIndex, groups, completedCount])

  // Find the group name if exercise is in a group
  const groupName = useMemo(() => {
    if (!groups || !exercise.id) return null
    const group = groups.find(g => g.exerciseIds.includes(exercise.id!))
    return group?.name ?? null
  }, [groups, exercise.id])

  // Check if there are meaningful differences between scopes
  const hasGroup = groupName !== null && scopeMatches['same-group'].length > 1
  const hasMultipleOccurrences = scopeMatches['all-in-sequence'].length > 1
  const hasSameConfig = scopeMatches['same-config'].length > 1

  // Get currently selected indices
  const selectedIndices = scopeMatches[selectedScope]

  const handleApply = () => {
    const configChange: ExerciseConfigChange = {}
    if (newConfig.measure !== oldConfig.measure) {
      configChange.measure = newConfig.measure
    }
    if (newConfig.targetValue !== oldConfig.targetValue) {
      configChange.targetValue = newConfig.targetValue
    }

    onApply(selectedScope, selectedIndices, configChange, persistToSequence)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Update Exercise Configuration</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Changing: <span className="font-medium">{exerciseName}</span>
              </p>
              <p className="text-sm">
                <span className="line-through text-muted-foreground">{formatConfig(oldConfig)}</span>
                {' → '}
                <span className="font-medium text-foreground">{formatConfig(newConfig)}</span>
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <RadioGroup
            value={selectedScope}
            onValueChange={(value: string) => setSelectedScope(value as UpdateScope)}
            className="space-y-3"
          >
            {/* This occurrence only */}
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="this-only" id="this-only" />
              <Label htmlFor="this-only" className="flex-1 cursor-pointer">
                This occurrence only
              </Label>
            </div>

            {/* Same group - only show if in a group */}
            {hasGroup && (
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="same-group" id="same-group" />
                <Label htmlFor="same-group" className="flex-1 cursor-pointer flex items-center gap-2">
                  All in group "{groupName}"
                  <Badge variant="secondary" className="text-xs">
                    {scopeMatches['same-group'].length}
                  </Badge>
                </Label>
              </div>
            )}

            {/* All in sequence - only show if multiple occurrences */}
            {hasMultipleOccurrences && (
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="all-in-sequence" id="all-in-sequence" />
                <Label htmlFor="all-in-sequence" className="flex-1 cursor-pointer flex items-center gap-2">
                  All "{exerciseName}" in sequence
                  <Badge variant="secondary" className="text-xs">
                    {scopeMatches['all-in-sequence'].length}
                  </Badge>
                </Label>
              </div>
            )}

            {/* Same config - only show if multiple with same config */}
            {hasSameConfig && (
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="same-config" id="same-config" />
                <Label htmlFor="same-config" className="flex-1 cursor-pointer flex items-center gap-2">
                  All with same config "{formatConfig(oldConfig)}"
                  <Badge variant="secondary" className="text-xs">
                    {scopeMatches['same-config'].length}
                  </Badge>
                </Label>
              </div>
            )}
          </RadioGroup>

          {/* Preview expandable section */}
          {selectedIndices.length > 1 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPreview ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Show affected exercises
              </button>
              {showPreview && (
                <div className="mt-2 p-3 bg-muted rounded-md text-sm max-h-32 overflow-y-auto">
                  <ul className="space-y-1">
                    {selectedIndices.map((idx) => {
                      const ex = exercises[idx]
                      const isCurrent = idx === exerciseIndex
                      return (
                        <li key={idx} className={isCurrent ? 'font-medium' : ''}>
                          #{idx + 1}: {ex.exerciseId === 'break' ? 'Break' : exerciseName}
                          {' '}
                          <span className="text-muted-foreground">
                            ({formatConfig(ex.config)})
                          </span>
                          {isCurrent && ' (current)'}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Persistence checkbox */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="persist"
                checked={persistToSequence}
                onCheckedChange={(checked) => setPersistToSequence(checked === true)}
              />
              <Label htmlFor="persist" className="cursor-pointer text-sm leading-relaxed">
                Save changes permanently to sequence
              </Label>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleApply}>
            Apply{selectedIndices.length > 1 ? ` (${selectedIndices.length})` : ''}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Export the matching function for use elsewhere
export { findMatchingExercises }
