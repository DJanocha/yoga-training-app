import { createTRPCRouter } from './trpc'
import { exercisesRouter } from './routers/exercises'
import { sequencesRouter } from './routers/sequences'
import { executionsRouter } from './routers/executions'
import { settingsRouter } from './routers/settings'

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
})

// export type definition of API
export type AppRouter = typeof appRouter
