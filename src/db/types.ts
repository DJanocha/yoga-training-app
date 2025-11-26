import { z } from 'zod'

// ============================================================================
// ENUMS
// ============================================================================
export const Level = z.enum(['beginner', 'intermediate', 'advanced'])
export type Level = z.infer<typeof Level>

export const Category = z.enum(['yoga', 'calisthenics', 'cardio', 'flexibility', 'strength'])
export type Category = z.infer<typeof Category>

export const BodyPart = z.enum([
  'arms',
  'legs',
  'core',
  'back',
  'chest',
  'shoulders',
  'full-body',
])
export type BodyPart = z.infer<typeof BodyPart>

export const GoalType = z.enum(['strict', 'elastic'])
export type GoalType = z.infer<typeof GoalType>

export const MeasureType = z.enum(['repetitions', 'time'])
export type MeasureType = z.infer<typeof MeasureType>

export const Theme = z.enum(['energy', 'zen'])
export type Theme = z.infer<typeof Theme>

export const ModifierUnit = z.enum(['kg', 'lbs', 'cm', 'inches', 'level', 'none'])
export type ModifierUnit = z.infer<typeof ModifierUnit>

export const ModifierEffect = z.enum(['easier', 'harder', 'neutral'])
export type ModifierEffect = z.infer<typeof ModifierEffect>

export const AchievementCategory = z.enum([
  'milestone',
  'streak',
  'personal-record',
  'consistency',
])
export type AchievementCategory = z.infer<typeof AchievementCategory>

// ============================================================================
// COMPLEX TYPES
// ============================================================================

// Exercise configuration within a sequence
// NOTE: goal was moved to sequence level (not per-exercise)
export const ExerciseConfig = z.object({
  measure: MeasureType,
  targetValue: z.number().optional(),
})
export type ExerciseConfig = z.infer<typeof ExerciseConfig>

// Modifier assignment for an exercise in a sequence
export const ExerciseModifierAssignment = z.object({
  modifierId: z.number(),
  effect: ModifierEffect.default('neutral'),
})
export type ExerciseModifierAssignment = z.infer<typeof ExerciseModifierAssignment>

// Exercise reference within a sequence (can be an exercise ID or 'break')
export const SequenceExercise = z.object({
  id: z.string().optional(), // Stable identifier for group references (optional for backwards compat)
  exerciseId: z.union([z.number(), z.literal('break')]),
  config: ExerciseConfig,
  modifiers: z.array(ExerciseModifierAssignment).optional(),
})
export type SequenceExercise = z.infer<typeof SequenceExercise>

// Exercise group within a sequence - groups exercises together
export const ExerciseGroup = z.object({
  id: z.string(),
  name: z.string().min(1, 'Group name is required'),
  exerciseIds: z.array(z.string()), // References to exercise IDs in the flat exercises array
})
export type ExerciseGroup = z.infer<typeof ExerciseGroup>

// Active modifier during exercise execution
export const ActiveModifier = z.object({
  modifierId: z.number(),
  value: z.string().optional(), // The actual value used (e.g., "5kg", "heavy")
})
export type ActiveModifier = z.infer<typeof ActiveModifier>

// Completed exercise within an execution
export const CompletedExercise = z.object({
  exerciseId: z.union([z.number(), z.literal('break')]),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  value: z.number().optional(),
  skipped: z.boolean().optional(),
  activeModifiers: z.array(ActiveModifier).optional(),
})
export type CompletedExercise = z.infer<typeof CompletedExercise>

// Personal record achievement
export const PersonalRecord = z.object({
  exerciseId: z.number(),
  type: MeasureType,
  previousBest: z.number().optional(),
  newBest: z.number(),
  modifierSignature: z.string().optional(), // e.g., "band:heavy,block:10cm" - PRs are tracked per modifier combo
})
export type PersonalRecord = z.infer<typeof PersonalRecord>

// Achievement metadata
export const AchievementMetadata = z.object({
  value: z.number().optional(),
  exerciseName: z.string().optional(),
})
export type AchievementMetadata = z.infer<typeof AchievementMetadata>

// ============================================================================
// REFINED SCHEMAS
// ============================================================================

// Exercise validation with URL and length constraints
export const refinedExerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  description: z.string().optional(),
  tips: z.string().optional(),
  modifications: z.array(z.string()).optional(),
  level: Level.optional(),
  category: Category.optional(),
  bodyParts: z.array(BodyPart).optional(),
  photoUrls: z.array(z.string().url()).default([]),
  videoUrls: z.array(z.string().url()).default([]),
  links: z.array(z.string().url()).default([]),
  isPreBuilt: z.boolean().default(false).optional(),
})

// Sequence validation
export const refinedSequenceSchema = z.object({
  name: z.string().min(1, 'Sequence name is required'),
  description: z.string().optional(),
  level: Level.optional(),
  category: Category.optional(),
  goal: GoalType.optional().default('elastic'), // Sequence-level goal (strict or elastic)
  exercises: z.array(SequenceExercise), // Allow empty during creation, validate when starting workout
  groups: z.array(ExerciseGroup).optional().default([]), // Exercise groups
  isFavorite: z.boolean().default(false).optional(),
  isPreBuilt: z.boolean().default(false).optional(),
})

// User settings validation
export const refinedUserSettingsSchema = z.object({
  userName: z.string().min(1, 'User name is required'),
  beepEnabled: z.boolean().default(false),
  beepStartSeconds: z.number().int().min(0).max(10).default(3),
  level: Level.optional(),
  focusArea: Category.optional(),
  hapticEnabled: z.boolean().default(true).optional(),
  contrastMode: z.boolean().default(false).optional(),
  weeklyGoal: z.number().int().min(1).max(7).optional(),
  theme: Theme.optional(),
  currentStreak: z.number().int().min(0).default(0).optional(),
  longestStreak: z.number().int().min(0).default(0).optional(),
  lastWorkoutDate: z.date().optional(),
  badges: z.array(z.string()).default([]).optional(),
})

// Execution rating validation
export const executionRatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().optional(),
})

// Modifier validation
export const refinedModifierSchema = z.object({
  name: z.string().min(1, 'Modifier name is required'),
  description: z.string().optional(),
  unit: ModifierUnit.optional(),
  value: z.number().int().min(0).optional(),
  iconName: z.string().optional(),
})
