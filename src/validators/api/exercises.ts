import { z } from 'zod'
import { insertExerciseSchema, updateExerciseSchema } from '../../db/schemas'
import { Level, Category, BodyPart } from '../../db/types'

/**
 * Validator for filtering exercises by level, category, and body part
 */
export const getFilteredExercisesInputValidator = z.object({
  level: Level.optional(),
  category: Category.optional(),
  bodyPart: BodyPart.optional(),
})

export type GetFilteredExercisesInput = z.infer<typeof getFilteredExercisesInputValidator>

/**
 * Validator for getting an exercise by ID
 */
export const getExerciseByIdInputValidator = z.object({
  id: z.number(),
})

export type GetExerciseByIdInput = z.infer<typeof getExerciseByIdInputValidator>

/**
 * Validator for creating a new exercise
 * Omits auto-managed fields
 */
export const createExerciseInputValidator = insertExerciseSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  deletedAt: true,
})

export type CreateExerciseInput = z.infer<typeof createExerciseInputValidator>

/**
 * Validator for updating an exercise
 * Omits auto-managed fields
 */
export const updateExerciseInputValidator = updateExerciseSchema.omit({
  userId: true,
  createdAt: true,
  deletedAt: true,
})

export type UpdateExerciseInput = z.infer<typeof updateExerciseInputValidator>

/**
 * Validator for soft deleting an exercise
 */
export const deleteExerciseInputValidator = z.object({
  id: z.number(),
})

export type DeleteExerciseInput = z.infer<typeof deleteExerciseInputValidator>
