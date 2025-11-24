import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/db"
import { env } from "@/env"
import { createAuthMiddleware } from "better-auth/api"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // PostgreSQL (Neon)
  }),
  emailAndPassword: {
    enabled: true,
  },
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Log all authentication events
      const timestamp = new Date().toISOString()
      const path = ctx.path

      // Sign-in events
      if (path.startsWith("/sign-in")) {
        const session = ctx.context.newSession
        if (session) {
          console.log(`[AUTH] ${timestamp} - SIGN_IN_SUCCESS`, {
            userId: session.user.id,
            email: session.user.email,
            path: path,
            userAgent: ctx.headers?.get("user-agent"),
          })
        } else {
          console.log(`[AUTH] ${timestamp} - SIGN_IN_FAILED`, {
            path: path,
            userAgent: ctx.headers?.get("user-agent"),
          })
        }
      }

      // Sign-up events
      if (path.startsWith("/sign-up")) {
        const session = ctx.context.newSession
        if (session) {
          console.log(`[AUTH] ${timestamp} - SIGN_UP_SUCCESS`, {
            userId: session.user.id,
            email: session.user.email,
            path: path,
            userAgent: ctx.headers?.get("user-agent"),
          })
        }
      }

      // Sign-out events
      if (path === "/sign-out") {
        console.log(`[AUTH] ${timestamp} - SIGN_OUT`, {
          path: path,
          userAgent: ctx.headers?.get("user-agent"),
        })
      }
    }),
  },
})
