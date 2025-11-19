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
export const ExerciseConfig = z.object({
  goal: GoalType,
  measure: MeasureType,
  targetValue: z.number().optional(),
})
export type ExerciseConfig = z.infer<typeof ExerciseConfig>

// Exercise reference within a sequence (can be an exercise ID or 'break')
export const SequenceExercise = z.object({
  exerciseId: z.union([z.number(), z.literal('break')]),
  config: ExerciseConfig,
})
export type SequenceExercise = z.infer<typeof SequenceExercise>

// Completed exercise within an execution
export const CompletedExercise = z.object({
  exerciseId: z.union([z.number(), z.literal('break')]),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  value: z.number().optional(),
  skipped: z.boolean().optional(),
})
export type CompletedExercise = z.infer<typeof CompletedExercise>

// Personal record achievement
export const PersonalRecord = z.object({
  exerciseId: z.number(),
  type: MeasureType,
  previousBest: z.number().optional(),
  newBest: z.number(),
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
  exercises: z.array(SequenceExercise).min(1, 'At least one exercise is required'),
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
