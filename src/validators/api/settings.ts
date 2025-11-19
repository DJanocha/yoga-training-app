import { z } from 'zod'
import { insertUserSettingsSchema } from '../../db/schemas'

/**
 * Validator for updating user settings
 * Omits fields that are auto-managed by the system
 */
export const updateUserSettingsInputValidator = insertUserSettingsSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  currentStreak: true,
  longestStreak: true,
  lastWorkoutDate: true,
  badges: true,
})

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsInputValidator>
