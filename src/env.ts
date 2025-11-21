import { createEnv } from '@t3-oss/env-core'
import { vercel,neonVercel } from '@t3-oss/env-core/presets-zod'
import { z } from 'zod'

const localEnv = import.meta.env??{}
const productionEnv =process.env??{}
const runtimeEnv = {...localEnv, ...productionEnv}

const showOnly =({from,keys,}:{ from: Record<string, unknown>,keys: string[] })=>Object.fromEntries(keys.map(key => [key, from[key]]))


console.log({local: showOnly({from: localEnv,keys: ['DATABASE_URL']}),production: showOnly({from: productionEnv,keys: ['DATABASE_URL']})})

export const env = createEnv({
  extends: [vercel(),neonVercel()],
  server: {
    SERVER_URL: z.url().optional(),
    DATABASE_URL: z.url().min(1),
    PORT: z.coerce.number().default(3333),
    API_PORT: z.coerce.number().default(3335),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url().optional(),
  },
  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: 'VITE_',

  client: {},
  shared: {
    VITE_APP_TITLE: z.string().min(1).optional(),
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  // runtimeEnv: process.env,
  runtimeEnv,

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
})


