import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import {
  user,
  exercises,
  sequences,
  sequenceExecutions,
  userSettings,
  achievements,
} from '@/db/schema'
import { refinedExerciseSchema, refinedSequenceSchema, refinedUserSettingsSchema } from '@/db/types'

// ============================================================================
// USER SCHEMAS (from better-auth)
// ============================================================================
export const insertUserSchema = createInsertSchema(user)
export const selectUserSchema = createSelectSchema(user)

// ============================================================================
// EXERCISES SCHEMAS
// ============================================================================
export const baseInsertExerciseSchema = createInsertSchema(exercises)
export const selectExerciseSchema = createSelectSchema(exercises)

// Refined insert schema with validation
export const insertExerciseSchema = baseInsertExerciseSchema.merge(refinedExerciseSchema)

export const updateExerciseSchema = insertExerciseSchema.partial().required({ id: true })

// ============================================================================
// SEQUENCES SCHEMAS
// ============================================================================
export const baseInsertSequenceSchema = createInsertSchema(sequences)
export const selectSequenceSchema = createSelectSchema(sequences)

// Refined insert schema with validation
export const insertSequenceSchema = baseInsertSequenceSchema.merge(refinedSequenceSchema)

export const updateSequenceSchema = insertSequenceSchema.partial().required({ id: true })

// ============================================================================
// SEQUENCE EXECUTIONS SCHEMAS
// ============================================================================
export const insertSequenceExecutionSchema = createInsertSchema(sequenceExecutions)
export const selectSequenceExecutionSchema = createSelectSchema(sequenceExecutions)
export const updateSequenceExecutionSchema = insertSequenceExecutionSchema
  .partial()
  .required({ id: true })

// ============================================================================
// USER SETTINGS SCHEMAS
// ============================================================================
export const baseInsertUserSettingsSchema = createInsertSchema(userSettings)
export const selectUserSettingsSchema = createSelectSchema(userSettings)

// Refined insert schema with validation
export const insertUserSettingsSchema = baseInsertUserSettingsSchema.merge(
  refinedUserSettingsSchema,
)

export const updateUserSettingsSchema = insertUserSettingsSchema.partial().required({ id: true })

// ============================================================================
// ACHIEVEMENTS SCHEMAS
// ============================================================================
export const insertAchievementSchema = createInsertSchema(achievements)
export const selectAchievementSchema = createSelectSchema(achievements)

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================
export type User = z.infer<typeof selectUserSchema>
export type InsertUser = z.infer<typeof insertUserSchema>

export type Exercise = z.infer<typeof selectExerciseSchema>
export type InsertExercise = z.infer<typeof insertExerciseSchema>
export type UpdateExercise = z.infer<typeof updateExerciseSchema>

export type Sequence = z.infer<typeof selectSequenceSchema>
export type InsertSequence = z.infer<typeof insertSequenceSchema>
export type UpdateSequence = z.infer<typeof updateSequenceSchema>

export type SequenceExecution = z.infer<typeof selectSequenceExecutionSchema>
export type InsertSequenceExecution = z.infer<typeof insertSequenceExecutionSchema>
export type UpdateSequenceExecution = z.infer<typeof updateSequenceExecutionSchema>

export type UserSettings = z.infer<typeof selectUserSettingsSchema>
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>

export type Achievement = z.infer<typeof selectAchievementSchema>
export type InsertAchievement = z.infer<typeof insertAchievementSchema>
