import { config } from 'dotenv'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from './schema.ts'
import { env } from '@/env'
import { neon } from '@neondatabase/serverless'
config()

let client: ReturnType<typeof neon>

export async function getClient() {
  if (!env.DATABASE_URL) {
    return undefined
  }
  if (!client) {
    client = await neon(env.DATABASE_URL!)
  }
  return client
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
})
export const db = drizzle(pool, { schema })
