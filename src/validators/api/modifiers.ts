import { z } from 'zod'
import { insertModifierSchema, updateModifierSchema } from '../entities'

/**
 * Validator for getting a modifier by ID
 */
export const getModifierByIdInputValidator = z.object({
  id: z.number(),
})

export type GetModifierByIdInput = z.infer<typeof getModifierByIdInputValidator>

/**
 * Validator for creating a new modifier
 * Omits auto-managed fields
 */
export const createModifierInputValidator = insertModifierSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  deletedAt: true,
})

export type CreateModifierInput = z.infer<typeof createModifierInputValidator>

/**
 * Validator for updating a modifier
 * Omits auto-managed fields
 */
export const updateModifierInputValidator = updateModifierSchema.omit({
  userId: true,
  createdAt: true,
  deletedAt: true,
})

export type UpdateModifierInput = z.infer<typeof updateModifierInputValidator>

/**
 * Validator for soft deleting a modifier
 */
export const deleteModifierInputValidator = z.object({
  id: z.number(),
})

export type DeleteModifierInput = z.infer<typeof deleteModifierInputValidator>
