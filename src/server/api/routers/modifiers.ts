import type { TRPCRouterRecord } from '@trpc/server'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { modifiers } from '@/db/schema'
import {
  getModifierByIdInputValidator,
  createModifierInputValidator,
  updateModifierInputValidator,
  deleteModifierInputValidator,
} from '@/validators/api/modifiers'
import { protectedProcedure } from '../trpc'

export const modifiersRouter = {
  /**
   * Get all modifiers for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const allModifiers = await db
      .select()
      .from(modifiers)
      .where(and(eq(modifiers.userId, ctx.userId), isNull(modifiers.deletedAt)))
      .orderBy(modifiers.name)

    return allModifiers
  }),

  /**
   * Get single modifier by ID
   */
  byId: protectedProcedure
    .input(getModifierByIdInputValidator)
    .query(async ({ ctx, input }) => {
      const [modifier] = await db
        .select()
        .from(modifiers)
        .where(
          and(
            eq(modifiers.id, input.id),
            eq(modifiers.userId, ctx.userId),
            isNull(modifiers.deletedAt),
          ),
        )
        .limit(1)

      return modifier ?? null
    }),

  /**
   * Create a new modifier
   */
  create: protectedProcedure
    .input(createModifierInputValidator)
    .mutation(async ({ ctx, input }) => {
      const [newModifier] = await db
        .insert(modifiers)
        .values({
          ...input,
          userId: ctx.userId,
        })
        .returning()

      return newModifier
    }),

  /**
   * Update an existing modifier
   */
  update: protectedProcedure
    .input(updateModifierInputValidator)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input

      // Verify ownership
      const [existing] = await db
        .select()
        .from(modifiers)
        .where(and(eq(modifiers.id, id), eq(modifiers.userId, ctx.userId)))
        .limit(1)

      if (!existing) {
        throw new Error('Modifier not found')
      }

      const [updated] = await db
        .update(modifiers)
        .set(updates)
        .where(eq(modifiers.id, id))
        .returning()

      return updated
    }),

  /**
   * Soft delete a modifier
   */
  delete: protectedProcedure
    .input(deleteModifierInputValidator)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [existing] = await db
        .select()
        .from(modifiers)
        .where(and(eq(modifiers.id, input.id), eq(modifiers.userId, ctx.userId)))
        .limit(1)

      if (!existing) {
        throw new Error('Modifier not found')
      }

      const [deleted] = await db
        .update(modifiers)
        .set({ deletedAt: new Date() })
        .where(eq(modifiers.id, input.id))
        .returning()

      return deleted
    }),
} satisfies TRPCRouterRecord
