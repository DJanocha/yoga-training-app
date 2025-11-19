import type { TRPCRouterRecord } from '@trpc/server'
import { eq, and, isNotNull, gte, lte, desc } from 'drizzle-orm'
import { db } from '~/db'
import { sequenceExecutions, sequences, exercises as exercisesTable, achievements } from '~/db/schema'
import {
  startExecutionInputValidator,
  updateExecutionInputValidator,
  getExecutionHistoryInputValidator,
  getLastAttemptInputValidator,
  submitRatingInputValidator,
} from '~/validators/api/executions'
import { protectedProcedure } from '../trpc'

export const executionsRouter = {
  /**
   * Start a new execution
   */
  start: protectedProcedure.input(startExecutionInputValidator).mutation(async ({ ctx, input }) => {
      // Verify sequence ownership
      const [sequence] = await db
        .select()
        .from(sequences)
        .where(and(eq(sequences.id, input.sequenceId), eq(sequences.userId, ctx.userId)))
        .limit(1)

      if (!sequence) {
        throw new Error('Sequence not found')
      }

      const [execution] = await db
        .insert(sequenceExecutions)
        .values({
          sequenceId: input.sequenceId,
          userId: ctx.userId,
          startedAt: new Date(),
          exercises: [],
          totalPauseDuration: 0,
        })
        .returning()

      return execution
    }),

  /**
   * Get user stats (all executions)
   */
  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    const stats = await db
      .select()
      .from(sequenceExecutions)
      .where(eq(sequenceExecutions.userId, ctx.userId))
      .orderBy(desc(sequenceExecutions.startedAt))

    return stats
  }),

  /**
   * Update execution state
   */
  updateExecution: protectedProcedure
    .input(updateExecutionInputValidator)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input

      // Verify ownership
      const [existing] = await db
        .select()
        .from(sequenceExecutions)
        .where(and(eq(sequenceExecutions.id, id), eq(sequenceExecutions.userId, ctx.userId)))
        .limit(1)

      if (!existing) {
        throw new Error('Execution not found')
      }

      const [updated] = await db
        .update(sequenceExecutions)
        .set(updates)
        .where(eq(sequenceExecutions.id, id))
        .returning()

      return updated
    }),

  /**
   * Get execution history with optional filters
   */
  getHistory: protectedProcedure
    .input(getExecutionHistoryInputValidator)
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(sequenceExecutions.userId, ctx.userId),
        isNotNull(sequenceExecutions.completedAt),
      ]

      if (input.startDate) {
        conditions.push(gte(sequenceExecutions.startedAt, input.startDate))
      }
      if (input.endDate) {
        conditions.push(lte(sequenceExecutions.startedAt, input.endDate))
      }

      const executions = await db
        .select()
        .from(sequenceExecutions)
        .where(and(...conditions))
        .orderBy(desc(sequenceExecutions.startedAt))

      // Process and filter exercises
      const result = []
      for (const execution of executions) {
        const [sequence] = await db
          .select()
          .from(sequences)
          .where(eq(sequences.id, execution.sequenceId))
          .limit(1)

        if (!sequence) continue

        const exercisesList = execution.exercises as Array<{
          exerciseId: number | 'break'
          startedAt: Date
          completedAt?: Date
          value?: number
          skipped?: boolean
        }>

        for (const exercise of exercisesList) {
          if (input.exerciseId && exercise.exerciseId !== input.exerciseId) {
            continue
          }

          let exerciseName = 'Break'
          if (exercise.exerciseId !== 'break') {
            const [ex] = await db
              .select()
              .from(exercisesTable)
              .where(eq(exercisesTable.id, exercise.exerciseId))
              .limit(1)
            exerciseName = ex?.name || 'Unknown'
          }

          result.push({
            executionId: execution.id,
            sequenceName: sequence.name,
            exerciseName,
            exerciseId: exercise.exerciseId,
            startedAt: exercise.startedAt,
            completedAt: exercise.completedAt,
            value: exercise.value,
            skipped: exercise.skipped,
          })
        }
      }

      return result
    }),

  /**
   * Get last attempt for a specific exercise
   */
  getLastAttempt: protectedProcedure
    .input(getLastAttemptInputValidator)
    .query(async ({ ctx, input }) => {
      const executions = await db
        .select()
        .from(sequenceExecutions)
        .where(and(eq(sequenceExecutions.userId, ctx.userId), isNotNull(sequenceExecutions.completedAt)))
        .orderBy(desc(sequenceExecutions.startedAt))

      for (const execution of executions) {
        const exercisesList = execution.exercises as Array<{
          exerciseId: number | 'break'
          completedAt?: Date
          value?: number
          skipped?: boolean
        }>

        const exercise = exercisesList.find(
          (e) =>
            e.exerciseId === input.exerciseId && !e.skipped && e.value !== undefined,
        )

        if (exercise) {
          return { value: exercise.value, completedAt: exercise.completedAt }
        }
      }

      return null
    }),

  /**
   * Export all execution data
   */
  exportData: protectedProcedure.query(async ({ ctx }) => {
    const executions = await db
      .select()
      .from(sequenceExecutions)
      .where(eq(sequenceExecutions.userId, ctx.userId))
      .orderBy(desc(sequenceExecutions.startedAt))

    const result = []
    for (const execution of executions) {
      const [sequence] = await db
        .select()
        .from(sequences)
        .where(eq(sequences.id, execution.sequenceId))
        .limit(1)

      result.push({
        ...execution,
        sequenceName: sequence?.name,
      })
    }

    return result
  }),

  /**
   * Submit rating and detect personal records
   */
  submitRating: protectedProcedure
    .input(submitRatingInputValidator)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [execution] = await db
        .select()
        .from(sequenceExecutions)
        .where(and(eq(sequenceExecutions.id, input.id), eq(sequenceExecutions.userId, ctx.userId)))
        .limit(1)

      if (!execution) {
        throw new Error('Execution not found')
      }

      // Detect personal records
      const personalRecords = []
      const exercisesList = execution.exercises as Array<{
        exerciseId: number | 'break'
        value?: number
        skipped?: boolean
      }>

      for (const exercise of exercisesList) {
        if (
          exercise.exerciseId === 'break' ||
          !exercise.value ||
          exercise.skipped
        ) {
          continue
        }

        // Find previous best
        const allExecutions = await db
          .select()
          .from(sequenceExecutions)
          .where(
            and(
              eq(sequenceExecutions.userId, ctx.userId),
              isNotNull(sequenceExecutions.completedAt),
            ),
          )

        let previousBest: number | undefined
        for (const exec of allExecutions) {
          if (exec.id === input.id) continue

          const execExercises = exec.exercises as Array<{
            exerciseId: number | 'break'
            value?: number
            skipped?: boolean
          }>

          const prevExercise = execExercises.find(
            (e) => e.exerciseId === exercise.exerciseId && !e.skipped,
          )

          if (prevExercise?.value && (!previousBest || prevExercise.value > previousBest)) {
            previousBest = prevExercise.value
          }
        }

        if (!previousBest || exercise.value > previousBest) {
          const [exerciseDoc] = await db
            .select()
            .from(exercisesTable)
            .where(eq(exercisesTable.id, exercise.exerciseId as number))
            .limit(1)

          const [sequence] = await db
            .select()
            .from(sequences)
            .where(eq(sequences.id, execution.sequenceId))
            .limit(1)

          const sequenceExercises = sequence?.exercises as Array<{
            exerciseId: number | 'break'
            config: { measure: 'repetitions' | 'time' }
          }>

          const sequenceExercise = sequenceExercises?.find(
            (e) => e.exerciseId === exercise.exerciseId,
          )

          personalRecords.push({
            exerciseId: exercise.exerciseId,
            type: sequenceExercise?.config.measure || 'repetitions',
            previousBest,
            newBest: exercise.value,
          })

          // Create achievement for PR
          if (exerciseDoc) {
            await db.insert(achievements).values({
              userId: ctx.userId,
              badgeId: `pr_${exerciseDoc.name.toLowerCase().replace(/\s+/g, '_')}`,
              unlockedAt: new Date(),
              category: 'personal-record',
              metadata: {
                value: exercise.value,
                exerciseName: exerciseDoc.name,
              },
            })
          }
        }
      }

      // Update execution with rating and PRs
      const [updated] = await db
        .update(sequenceExecutions)
        .set({
          rating: input.rating,
          feedback: input.feedback,
          personalRecords: personalRecords.length > 0 ? personalRecords : null,
        })
        .where(eq(sequenceExecutions.id, input.id))
        .returning()

      return { execution: updated, personalRecords }
    }),

  /**
   * Get detailed stats (total workouts, exercises, minutes, avg rating, PRs)
   */
  getDetailedStats: protectedProcedure.query(async ({ ctx }) => {
    const executions = await db
      .select()
      .from(sequenceExecutions)
      .where(and(eq(sequenceExecutions.userId, ctx.userId), isNotNull(sequenceExecutions.completedAt)))

    const totalWorkouts = executions.length

    let totalExercises = 0
    for (const execution of executions) {
      const exercisesList = execution.exercises as Array<{ skipped?: boolean }>
      totalExercises += exercisesList.filter((e) => !e.skipped).length
    }

    const totalMinutes = Math.floor(
      executions.reduce((sum, e) => {
        if (!e.completedAt) return sum
        const duration =
          new Date(e.completedAt).getTime() -
          new Date(e.startedAt).getTime() -
          e.totalPauseDuration
        return sum + duration
      }, 0) / 60000,
    )

    const ratingsCount = executions.filter((e) => e.rating).length
    const avgRating =
      ratingsCount > 0
        ? executions.reduce((sum, e) => sum + (e.rating || 0), 0) / ratingsCount
        : 0

    const personalRecords = executions
      .filter((e) => e.personalRecords)
      .reduce((sum, e) => {
        const prs = e.personalRecords as Array<unknown>
        return sum + (prs?.length || 0)
      }, 0)

    return {
      totalWorkouts,
      totalExercises,
      totalMinutes,
      avgRating: Math.round(avgRating * 10) / 10,
      personalRecords,
    }
  }),

  /**
   * Get weekly progress (last 7 days workout counts)
   */
  getWeeklyProgress: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const executions = await db
      .select()
      .from(sequenceExecutions)
      .where(
        and(
          eq(sequenceExecutions.userId, ctx.userId),
          isNotNull(sequenceExecutions.completedAt),
          gte(sequenceExecutions.startedAt, weekAgo),
        ),
      )

    // Group by day
    const dayMap = new Map<string, number>()
    for (const execution of executions) {
      const date = new Date(execution.startedAt)
      date.setHours(0, 0, 0, 0)
      const dateStr = date.toISOString().split('T')[0]
      dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + 1)
    }

    // Create array for last 7 days
    const result = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      date.setHours(0, 0, 0, 0)
      const dateStr = date.toISOString().split('T')[0]
      result.push({
        date: dateStr,
        workouts: dayMap.get(dateStr) || 0,
      })
    }

    return result
  }),
} satisfies TRPCRouterRecord
