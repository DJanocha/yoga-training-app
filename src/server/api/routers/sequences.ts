import type { TRPCRouterRecord } from '@trpc/server'
import { eq, and, isNull, desc } from 'drizzle-orm'
import {db } from '@/db'
import { sequences } from '../../../db/schema'
import {
  getSequenceByIdInputValidator,
  calculateSequenceDurationInputValidator,
  createSequenceInputValidator,
  updateSequenceInputValidator,
  deleteSequenceInputValidator,
  duplicateSequenceInputValidator,
  toggleSequenceFavoriteInputValidator,
} from '../../../validators/api/sequences'
import { protectedProcedure } from '../trpc'

export const sequencesRouter = {
  /**
   * Get all sequences for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const allSequences = await db
      .select()
      .from(sequences)
      .where(and(eq(sequences.userId, ctx.userId), isNull(sequences.deletedAt)))
      .orderBy(desc(sequences.createdAt))

    return allSequences
  }),

  /**
   * Get single sequence by ID
   */
  byId: protectedProcedure.input(getSequenceByIdInputValidator).query(async ({ ctx, input }) => {
      const [sequence] = await db
        .select()
        .from(sequences)
        .where(
          and(
            eq(sequences.id, input.id),
            eq(sequences.userId, ctx.userId),
            isNull(sequences.deletedAt),
          ),
        )
        .limit(1)

      return sequence ?? null
    }),

  /**
   * Calculate total duration from time-based exercises
   */
  calculateDuration: protectedProcedure
    .input(calculateSequenceDurationInputValidator)
    .query(async ({ ctx, input }) => {
      const [sequence] = await db
        .select()
        .from(sequences)
        .where(and(eq(sequences.id, input.id), eq(sequences.userId, ctx.userId)))
        .limit(1)

      if (!sequence) {
        return null
      }

      // Parse the exercises JSON
      const exercisesList = sequence.exercises as Array<{
        exerciseId: number | 'break'
        config: {
          goal: 'strict' | 'elastic'
          measure: 'repetitions' | 'time'
          targetValue?: number
        }
      }>

      let totalSeconds = 0
      for (const exercise of exercisesList) {
        if (exercise.config.measure === 'time' && exercise.config.targetValue) {
          totalSeconds += exercise.config.targetValue
        }
      }

      return {
        totalSeconds,
        totalMinutes: Math.floor(totalSeconds / 60),
        formattedDuration: `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`,
      }
    }),

  /**
   * Create a new sequence
   */
  create: protectedProcedure
    .input(createSequenceInputValidator)
    .mutation(async ({ ctx, input }) => {
      const [newSequence] = await db
        .insert(sequences)
        .values({
          ...input,
          userId: ctx.userId,
        })
        .returning()

      return newSequence
    }),

  /**
   * Update an existing sequence
   */
  update: protectedProcedure
    .input(updateSequenceInputValidator)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input

      // Verify ownership
      const [existing] = await db
        .select()
        .from(sequences)
        .where(and(eq(sequences.id, id), eq(sequences.userId, ctx.userId)))
        .limit(1)

      if (!existing) {
        throw new Error('Sequence not found')
      }

      const [updated] = await db
        .update(sequences)
        .set(updates)
        .where(eq(sequences.id, id))
        .returning()

      return updated
    }),

  /**
   * Soft delete a sequence
   */
  delete: protectedProcedure.input(deleteSequenceInputValidator).mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [existing] = await db
        .select()
        .from(sequences)
        .where(and(eq(sequences.id, input.id), eq(sequences.userId, ctx.userId)))
        .limit(1)

      if (!existing) {
        throw new Error('Sequence not found')
      }

      const [deleted] = await db
        .update(sequences)
        .set({ deletedAt: new Date() })
        .where(eq(sequences.id, input.id))
        .returning()

      return deleted
    }),

  /**
   * Duplicate a sequence with " (Copy)" suffix
   */
  duplicate: protectedProcedure
    .input(duplicateSequenceInputValidator)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership and get original
      const [original] = await db
        .select()
        .from(sequences)
        .where(and(eq(sequences.id, input.id), eq(sequences.userId, ctx.userId)))
        .limit(1)

      if (!original) {
        throw new Error('Sequence not found')
      }

      // Create duplicate
      const [duplicate] = await db
        .insert(sequences)
        .values({
          name: `${original.name} (Copy)`,
          description: original.description,
          level: original.level,
          category: original.category,
          exercises: original.exercises,
          userId: ctx.userId,
          isFavorite: false,
          isPreBuilt: false,
        })
        .returning()

      return duplicate
    }),

  /**
   * Toggle favorite status
   */
  toggleFavorite: protectedProcedure
    .input(toggleSequenceFavoriteInputValidator)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership and get current state
      const [existing] = await db
        .select()
        .from(sequences)
        .where(and(eq(sequences.id, input.id), eq(sequences.userId, ctx.userId)))
        .limit(1)

      if (!existing) {
        throw new Error('Sequence not found')
      }

      const [updated] = await db
        .update(sequences)
        .set({ isFavorite: !existing.isFavorite })
        .where(eq(sequences.id, input.id))
        .returning()

      return updated
    }),
} satisfies TRPCRouterRecord
