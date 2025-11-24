import type { TRPCRouterRecord } from '@trpc/server'
import { eq, desc } from 'drizzle-orm'
import { db } from '@/db'
import { achievements } from '../../../db/schema'
import { protectedProcedure } from '../trpc'

export const achievementsRouter = {
  /**
   * Get all user achievements
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, ctx.userId))
      .orderBy(desc(achievements.unlockedAt))

    return userAchievements
  }),

  /**
   * Get achievement count by category
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, ctx.userId))

    const stats = {
      total: userAchievements.length,
      milestone: userAchievements.filter((a) => a.category === 'milestone').length,
      streak: userAchievements.filter((a) => a.category === 'streak').length,
      personalRecord: userAchievements.filter((a) => a.category === 'personal-record')
        .length,
      consistency: userAchievements.filter((a) => a.category === 'consistency').length,
    }

    return stats
  }),
} satisfies TRPCRouterRecord
