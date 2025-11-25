import type { z } from 'zod'
import { insertUserSettingsSchema } from '../entities'

/**
 * Validator for updating user settings
 * Makes userName optional since the profile page handles that separately.
 * Omits fields that are auto-managed by the system.
 */
export const updateUserSettingsInputValidator = insertUserSettingsSchema
  .omit({
    id: true,
    userId: true,
    createdAt: true,
    currentStreak: true,
    longestStreak: true,
    lastWorkoutDate: true,
    badges: true,
  })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  )

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsInputValidator>
