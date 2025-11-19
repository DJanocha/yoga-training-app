import type { TRPCRouterRecord } from '@trpc/server'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { db } from '~/db'
import { exercises } from '~/db/schema'
import {
  getFilteredExercisesInputValidator,
  getExerciseByIdInputValidator,
  createExerciseInputValidator,
  updateExerciseInputValidator,
  deleteExerciseInputValidator,
} from '~/validators/api/exercises'
import { protectedProcedure } from '../trpc'

export const exercisesRouter = {
  /**
   * Get all exercises for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const allExercises = await db
      .select()
      .from(exercises)
      .where(and(eq(exercises.userId, ctx.userId), isNull(exercises.deletedAt)))
      .orderBy(exercises.createdAt)

    return allExercises
  }),

  /**
   * Get exercises with optional filters
   */
  filteredList: protectedProcedure
    .input(getFilteredExercisesInputValidator)
    .query(async ({ ctx, input }) => {
      const conditions = [eq(exercises.userId, ctx.userId), isNull(exercises.deletedAt)]

      if (input.level) {
        conditions.push(eq(exercises.level, input.level))
      }
      if (input.category) {
        conditions.push(eq(exercises.category, input.category))
      }
      if (input.bodyPart) {
        // For array contains check
        conditions.push(sql`${exercises.bodyParts} @> ARRAY[${input.bodyPart}]::text[]`)
      }

      const filtered = await db
        .select()
        .from(exercises)
        .where(and(...conditions))
        .orderBy(exercises.createdAt)

      return filtered
    }),

  /**
   * Get single exercise by ID
   */
  byId: protectedProcedure.input(getExerciseByIdInputValidator).query(async ({ ctx, input }) => {
      const [exercise] = await db
        .select()
        .from(exercises)
        .where(
          and(
            eq(exercises.id, input.id),
            eq(exercises.userId, ctx.userId),
            isNull(exercises.deletedAt),
          ),
        )
        .limit(1)

      return exercise ?? null
    }),

  /**
   * Create a new exercise
   */
  create: protectedProcedure
    .input(createExerciseInputValidator)
    .mutation(async ({ ctx, input }) => {
      const [newExercise] = await db
        .insert(exercises)
        .values({
          ...input,
          userId: ctx.userId,
        })
        .returning()

      return newExercise
    }),

  /**
   * Update an existing exercise
   */
  update: protectedProcedure
    .input(updateExerciseInputValidator)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input

      // Verify ownership
      const [existing] = await db
        .select()
        .from(exercises)
        .where(and(eq(exercises.id, id), eq(exercises.userId, ctx.userId)))
        .limit(1)

      if (!existing) {
        throw new Error('Exercise not found')
      }

      const [updated] = await db
        .update(exercises)
        .set(updates)
        .where(eq(exercises.id, id))
        .returning()

      return updated
    }),

  /**
   * Soft delete an exercise
   */
  delete: protectedProcedure.input(deleteExerciseInputValidator).mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [existing] = await db
        .select()
        .from(exercises)
        .where(and(eq(exercises.id, input.id), eq(exercises.userId, ctx.userId)))
        .limit(1)

      if (!existing) {
        throw new Error('Exercise not found')
      }

      const [deleted] = await db
        .update(exercises)
        .set({ deletedAt: new Date() })
        .where(eq(exercises.id, input.id))
        .returning()

      return deleted
    }),

  /**
   * Generate upload URL for exercise media
   * TODO: Implement actual file upload solution (S3, Cloudinary, etc.)
   */
  generateUploadUrl: protectedProcedure.mutation(async () => {
    // Placeholder implementation
    // In production, this would call your file upload service
    return {
      uploadUrl: 'https://api.example.com/upload',
      message: 'File upload not yet implemented - use URL-based storage for now',
    }
  }),
} satisfies TRPCRouterRecord
