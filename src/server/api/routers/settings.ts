import type { TRPCRouterRecord } from '@trpc/server'
import { eq, and, isNotNull } from 'drizzle-orm'
import {db } from '@/db'
import { userSettings, sequenceExecutions, achievements } from '../../../db/schema'
import { updateUserSettingsInputValidator } from '../../../validators/api/settings'
import { protectedProcedure } from '../trpc'

export const settingsRouter = {
  /**
   * Get user settings (returns defaults if not found)
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, ctx.userId))
      .limit(1)

    if (!settings) {
      // Return default settings
      return {
        userName: 'User',
        beepEnabled: true,
        beepStartSeconds: 3,
        hapticEnabled: true,
        contrastMode: false,
        weeklyGoal: 3,
        theme: undefined as 'energy' | 'zen' | undefined,
        currentStreak: 0,
        longestStreak: 0,
        badges: [],
      }
    }

    return settings
  }),

  /**
   * Update user settings (upsert)
   */
  update: protectedProcedure
    .input(updateUserSettingsInputValidator)
    .mutation(async ({ ctx, input }) => {
      const [existing] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.userId))
        .limit(1)

      if (existing) {
        const [updated] = await db
          .update(userSettings)
          .set(input)
          .where(eq(userSettings.id, existing.id))
          .returning()
        return updated
      } else {
        const [created] = await db
          .insert(userSettings)
          .values({
            ...input,
            userId: ctx.userId,
          })
          .returning()
        return created
      }
    }),

  /**
   * Calculate current and longest streak
   */
  calculateStreak: protectedProcedure.mutation(async ({ ctx }) => {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, ctx.userId))
      .limit(1)

    if (!settings) {
      return { currentStreak: 0, longestStreak: 0 }
    }

    // Get all completed workouts sorted by date
    const executions = await db
      .select()
      .from(sequenceExecutions)
      .where(and(eq(sequenceExecutions.userId, ctx.userId), isNotNull(sequenceExecutions.completedAt)))

    if (executions.length === 0) {
      await db
        .update(userSettings)
        .set({
          currentStreak: 0,
          longestStreak: 0,
          lastWorkoutDate: null,
        })
        .where(eq(userSettings.id, settings.id))

      return { currentStreak: 0, longestStreak: 0 }
    }

    // Sort by completion date descending
    const sorted = executions.sort(
      (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime(),
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    // Get unique workout dates
    const workoutDates = new Set<number>()
    for (const execution of sorted) {
      if (!execution.completedAt) continue
      const date = new Date(execution.completedAt)
      date.setHours(0, 0, 0, 0)
      workoutDates.add(date.getTime())
    }

    const uniqueDates = Array.from(workoutDates).sort((a, b) => b - a)

    // Calculate current streak
    let currentStreak = 0
    const oneDayMs = 24 * 60 * 60 * 1000

    // Check if there's a workout today or yesterday
    const lastWorkoutDate = uniqueDates[0]
    const daysSinceLastWorkout = Math.floor((todayTimestamp - lastWorkoutDate) / oneDayMs)

    if (daysSinceLastWorkout <= 1) {
      // Calculate streak
      let expectedDate = lastWorkoutDate
      for (const date of uniqueDates) {
        const diff = Math.floor((expectedDate - date) / oneDayMs)
        if (diff === 0 || diff === 1) {
          currentStreak++
          expectedDate = date - oneDayMs
        } else {
          break
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 1
    for (let i = 1; i < uniqueDates.length; i++) {
      const diff = Math.floor((uniqueDates[i - 1] - uniqueDates[i]) / oneDayMs)
      if (diff === 1) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak)

    await db
      .update(userSettings)
      .set({
        currentStreak,
        longestStreak,
        lastWorkoutDate: sorted[0].completedAt,
      })
      .where(eq(userSettings.id, settings.id))

    return { currentStreak, longestStreak }
  }),

  /**
   * Check and award badges (milestone, streak, consistency)
   */
  checkBadges: protectedProcedure.mutation(async ({ ctx }) => {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, ctx.userId))
      .limit(1)

    if (!settings) {
      return []
    }

    const executions = await db
      .select()
      .from(sequenceExecutions)
      .where(and(eq(sequenceExecutions.userId, ctx.userId), isNotNull(sequenceExecutions.completedAt)))

    const existingAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, ctx.userId))

    const existingBadgeIds = new Set(existingAchievements.map((a) => a.badgeId))
    const newBadges = []

    // Milestone badges
    const totalWorkouts = executions.length
    const milestones = [
      { count: 1, id: 'first_workout', name: 'First Workout' },
      { count: 5, id: 'workout_5', name: '5 Workouts' },
      { count: 10, id: 'workout_10', name: '10 Workouts' },
      { count: 25, id: 'workout_25', name: '25 Workouts' },
      { count: 50, id: 'workout_50', name: '50 Workouts' },
      { count: 100, id: 'workout_100', name: '100 Workouts' },
    ]

    for (const milestone of milestones) {
      if (totalWorkouts >= milestone.count && !existingBadgeIds.has(milestone.id)) {
        await db.insert(achievements).values({
          userId: ctx.userId,
          badgeId: milestone.id,
          unlockedAt: new Date(),
          category: 'milestone',
          metadata: {
            value: milestone.count,
          },
        })
        newBadges.push(milestone.id)
      }
    }

    // Streak badges
    const currentStreak = settings.currentStreak || 0
    const streakMilestones = [
      { count: 3, id: 'streak_3', name: '3 Day Streak' },
      { count: 7, id: 'streak_7', name: '7 Day Streak' },
      { count: 14, id: 'streak_14', name: '14 Day Streak' },
      { count: 30, id: 'streak_30', name: '30 Day Streak' },
      { count: 100, id: 'streak_100', name: '100 Day Streak' },
    ]

    for (const streak of streakMilestones) {
      if (currentStreak >= streak.count && !existingBadgeIds.has(streak.id)) {
        await db.insert(achievements).values({
          userId: ctx.userId,
          badgeId: streak.id,
          unlockedAt: new Date(),
          category: 'streak',
          metadata: {
            value: streak.count,
          },
        })
        newBadges.push(streak.id)
      }
    }

    // Consistency badges (workouts in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const last30DaysWorkouts = executions.filter(
      (e) => e.completedAt && new Date(e.completedAt) >= thirtyDaysAgo,
    )

    if (last30DaysWorkouts.length >= 12 && !existingBadgeIds.has('consistent_12')) {
      await db.insert(achievements).values({
        userId: ctx.userId,
        badgeId: 'consistent_12',
        unlockedAt: new Date(),
        category: 'consistency',
        metadata: {
          value: 12,
        },
      })
      newBadges.push('consistent_12')
    }

    if (last30DaysWorkouts.length >= 20 && !existingBadgeIds.has('consistent_20')) {
      await db.insert(achievements).values({
        userId: ctx.userId,
        badgeId: 'consistent_20',
        unlockedAt: new Date(),
        category: 'consistency',
        metadata: {
          value: 20,
        },
      })
      newBadges.push('consistent_20')
    }

    return newBadges
  }),
} satisfies TRPCRouterRecord
