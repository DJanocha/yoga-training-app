import { createTRPCRouter } from './trpc'
import { exercisesRouter } from './routers/exercises'
import { sequencesRouter } from './routers/sequences'
import { executionsRouter } from './routers/executions'
import { settingsRouter } from './routers/settings'
import { achievementsRouter } from './routers/achievements'
import { modifiersRouter } from './routers/modifiers'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  exercises: exercisesRouter,
  sequences: sequencesRouter,
  executions: executionsRouter,
  settings: settingsRouter,
  achievements: achievementsRouter,
  modifiers: modifiersRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
