import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/db"
import { env } from "@/env"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // PostgreSQL (Neon)
  }),
  emailAndPassword: {
    enabled: true,
  },
  baseURL: env.BETTER_AUTH_URL || "http://localhost:4321",
  secret: env.BETTER_AUTH_SECRET,
})
