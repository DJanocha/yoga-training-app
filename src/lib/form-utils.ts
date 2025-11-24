import { Level, Category, BodyPart, Theme, GoalType, MeasureType } from '@/db/types'

// ============================================================================
// LABEL UTILITIES
// ============================================================================

/**
 * Convert a camelCase or snake_case field key to a human-readable label
 * @example keyToLabel('bodyParts') // 'Body Parts'
 * @example keyToLabel('photoUrls') // 'Photo Urls'
 */
export function keyToLabel(key: string): string {
  return key
    // Insert space before uppercase letters
    .replace(/([A-Z])/g, ' $1')
    // Replace underscores with spaces
    .replace(/_/g, ' ')
    // Capitalize first letter
    .replace(/^./, (s) => s.toUpperCase())
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Get label for a field, using override if available
 */
export function getFieldLabel(
  key: string,
  overrides?: Record<string, string>
): string {
  return overrides?.[key] ?? keyToLabel(key)
}

// ============================================================================
// ENUM OPTION CONVERTERS
// ============================================================================

type SelectOption = { label: string; value: string }

/**
 * Convert a Zod enum to select options
 */
export function enumToSelectOptions(
  enumValues: readonly string[],
  labelOverrides?: Record<string, string>
): SelectOption[] {
  return enumValues.map((value) => ({
    label: labelOverrides?.[value] ?? keyToLabel(value),
    value,
  }))
}

// Pre-built select options for common enums
export const levelOptions = enumToSelectOptions(Level.options)
export const categoryOptions = enumToSelectOptions(Category.options)
export const themeOptions = enumToSelectOptions(Theme.options)
export const goalTypeOptions = enumToSelectOptions(GoalType.options)
export const measureTypeOptions = enumToSelectOptions(MeasureType.options)

// Pre-built checkbox options for array enums
export const bodyPartOptions = enumToSelectOptions(BodyPart.options, {
  'full-body': 'Full Body',
})

// ============================================================================
// LABEL OVERRIDES BY ENTITY
// ============================================================================

export const exerciseLabelOverrides: Record<string, string> = {
  bodyParts: 'Target Body Parts',
  photoUrls: 'Photo URLs',
  videoUrls: 'Video URLs',
  isPreBuilt: 'Pre-built Exercise',
}

export const sequenceLabelOverrides: Record<string, string> = {
  isFavorite: 'Mark as Favorite',
  isPreBuilt: 'Pre-built Sequence',
}

export const settingsLabelOverrides: Record<string, string> = {
  userName: 'Display Name',
  beepEnabled: 'Enable Beep',
  beepStartSeconds: 'Beep Start (seconds)',
  hapticEnabled: 'Enable Haptic Feedback',
  contrastMode: 'High Contrast Mode',
  weeklyGoal: 'Weekly Goal (workouts)',
  focusArea: 'Focus Area',
}

// ============================================================================
// REQUIRED FIELDS BY ENTITY
// ============================================================================

// Explicitly define required fields for each entity
// This is simpler and more maintainable than trying to infer from Zod

export const exerciseRequiredFields = ['name'] as const
export const sequenceRequiredFields = ['name'] as const
export const settingsRequiredFields = ['userName'] as const

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const exerciseDefaultValues = {
  name: '',
  description: '',
  tips: '',
  modifications: [] as string[],
  level: undefined as string | undefined,
  category: undefined as string | undefined,
  bodyParts: [] as string[],
  photoUrls: [] as string[],
  videoUrls: [] as string[],
  links: [] as string[],
  isPreBuilt: false,
}

export const sequenceDefaultValues = {
  name: '',
  description: '',
  level: undefined as string | undefined,
  category: undefined as string | undefined,
  exercises: [] as Array<{ exerciseId: number | 'break'; config: { goal: string; measure: string; targetValue?: number } }>,
  isFavorite: false,
  isPreBuilt: false,
}

// Required-only defaults for quick create
export const exerciseRequiredDefaults = {
  name: '',
}

export const sequenceRequiredDefaults = {
  name: '',
}
