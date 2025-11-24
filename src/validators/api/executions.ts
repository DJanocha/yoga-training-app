import { z } from 'zod'

/**
 * Validator for starting a new sequence execution
 */
export const startExecutionInputValidator = z.object({
  sequenceId: z.number(),
})

export type StartExecutionInput = z.infer<typeof startExecutionInputValidator>

/**
 * Validator for updating execution state
 */
export const updateExecutionInputValidator = z.object({
  id: z.number(),
  exercises: z.array(
    z.object({
      exerciseId: z.union([z.number(), z.literal('break')]),
      startedAt: z.date(),
      completedAt: z.date().optional(),
      value: z.number().optional(),
      skipped: z.boolean().optional(),
    }),
  ),
  pausedAt: z.date().optional(),
  totalPauseDuration: z.number(),
  completedAt: z.date().optional(),
})

export type UpdateExecutionInput = z.infer<typeof updateExecutionInputValidator>

/**
 * Validator for getting execution history with optional filters
 */
export const getExecutionHistoryInputValidator = z.object({
  exerciseId: z.union([z.number(), z.literal('break')]).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
})

export type GetExecutionHistoryInput = z.infer<typeof getExecutionHistoryInputValidator>

/**
 * Validator for getting last attempt for a specific exercise
 */
export const getLastAttemptInputValidator = z.object({
  exerciseId: z.union([z.number(), z.literal('break')]),
})

export type GetLastAttemptInput = z.infer<typeof getLastAttemptInputValidator>

/**
 * Validator for getting execution by ID
 */
export const getByIdInputValidator = z.object({
  id: z.number(),
})

export type GetByIdInput = z.infer<typeof getByIdInputValidator>

/**
 * Validator for submitting execution rating and detecting personal records
 */
export const submitRatingInputValidator = z.object({
  id: z.number(),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
})

export type SubmitRatingInput = z.infer<typeof submitRatingInputValidator>
