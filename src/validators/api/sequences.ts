import { z } from 'zod'
import { insertSequenceSchema, updateSequenceSchema } from '../../db/schemas'

/**
 * Validator for getting a sequence by ID
 */
export const getSequenceByIdInputValidator = z.object({
  id: z.number(),
})

export type GetSequenceByIdInput = z.infer<typeof getSequenceByIdInputValidator>

/**
 * Validator for calculating sequence duration
 */
export const calculateSequenceDurationInputValidator = z.object({
  id: z.number(),
})

export type CalculateSequenceDurationInput = z.infer<
  typeof calculateSequenceDurationInputValidator
>

/**
 * Validator for creating a new sequence
 * Omits auto-managed fields
 */
export const createSequenceInputValidator = insertSequenceSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  deletedAt: true,
  isFavorite: true,
  isPreBuilt: true,
})

export type CreateSequenceInput = z.infer<typeof createSequenceInputValidator>

/**
 * Validator for updating a sequence
 * Omits auto-managed fields
 */
export const updateSequenceInputValidator = updateSequenceSchema.omit({
  userId: true,
  createdAt: true,
  deletedAt: true,
  isFavorite: true,
  isPreBuilt: true,
})

export type UpdateSequenceInput = z.infer<typeof updateSequenceInputValidator>

/**
 * Validator for soft deleting a sequence
 */
export const deleteSequenceInputValidator = z.object({
  id: z.number(),
})

export type DeleteSequenceInput = z.infer<typeof deleteSequenceInputValidator>

/**
 * Validator for duplicating a sequence
 */
export const duplicateSequenceInputValidator = z.object({
  id: z.number(),
})

export type DuplicateSequenceInput = z.infer<typeof duplicateSequenceInputValidator>

/**
 * Validator for toggling sequence favorite status
 */
export const toggleSequenceFavoriteInputValidator = z.object({
  id: z.number(),
})

export type ToggleSequenceFavoriteInput = z.infer<
  typeof toggleSequenceFavoriteInputValidator
>
