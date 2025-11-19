# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Git messages

- Never speak about claude in commit messages unless explicitly asked
- When implementing things without committing them, propose a descriptive commit message

# shadcn instructions

Use the latest version of Shadcn to install new components, like this command to add a button component:

```bash
pnpx shadcn@latest add button
```

# Implementing Plans from Markdown Files

When implementing a plan from markdown files with checkboxes and phases (like MIGRATION.md or ROADMAP.md):

## Work in Phase Blocks

1. **Implement complete phases at once**: Work on entire phase sections (e.g., Phase 5.1, Phase 5.2) in one go, not individual checkboxes
2. **Update checkboxes**: After completing implementation, check all checkboxes `[ ]` → `[x]` that you believe are properly implemented
3. **Stage everything together**: Use `git add` to stage all modified files from that phase (code changes + markdown updates)
4. **Commit with descriptive message**: Write a clear commit message describing:
   - What phase was implemented
   - Key changes made
   - Any important details about the implementation

## Example Workflow

```bash
# 1. Implement entire Phase 5.1 (all tasks)
# 2. Update MIGRATION.md checkboxes for Phase 5.1
# 3. Stage all changes
git add .

# 4. Commit with descriptive message
git commit -m "feat(migration): implement phase 5.1 - export convex data

Exported all Convex tables to JSON format:
- exercises.json (123 records)
- sequences.json (45 records)
- executions.json (567 records)
- userSettings.json (12 records)
- achievements.json (89 records)

All data saved to convex-export/ directory for migration to Postgres."
```

## Benefits of This Approach

- **Atomic commits**: Each phase is a complete, working unit
- **Clear history**: Easy to track progress and rollback if needed
- **Accurate documentation**: Checkboxes reflect actual implementation state
- **Better collaboration**: Team members can see exactly what's done

# Security

DO NOT ACCESS `.env.*` FILES WHEN NOT EXPLICITLY ASKED TO!

## Project Overview

This is a yoga training application built with React, TanStack Router, and a modern full-stack architecture. The app allows users to create custom yoga exercises, organize them into sequences, execute those sequences with tracking, and view their progress over time.

## Tech Stack

- **Frontend**: React 19, TanStack Router, TanStack React Start, Vite
- **Backend**: tRPC v11 (type-safe API layer)
- **Database**: Neon Postgres + Drizzle ORM
- **Authentication**: Clerk
- **Styling**: Tailwind CSS v4, Radix UI components
- **State Management**: TanStack React Query with tRPC integration
- **TypeScript**: Strict mode enabled

## Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm lint

# Format code
pnpm format

# Database migrations
pnpm drizzle-kit generate  # Generate migration files
pnpm drizzle-kit push      # Apply migrations to database
```

The dev server runs on port 3333 (see `src/consts.ts`).

## Architecture

### Database Layer (Drizzle + Neon Postgres)

The database schema is defined using Drizzle ORM in `src/db/`:

- **`src/db/schema.ts`**: PostgreSQL schema definition

  - `users`: User accounts (id, clerkId, email)
  - `exercises`: User's custom yoga exercises with URL-based media
  - `sequences`: Ordered collections of exercises with configuration (goal, measure, target)
  - `sequenceExecutions`: Workout session tracking with exercise completion data
  - `userSettings`: User preferences (name, beep settings, theme, streaks)
  - `achievements`: Unlocked badges and milestones

- **`src/db/schemas.ts`**: Zod schemas generated from Drizzle (createInsertSchema, createSelectSchema)
- **`src/db/types.ts`**: Shared TypeScript types and enums
- **`src/db/index.ts`**: Database connection using Neon serverless driver

### API Layer (tRPC)

Type-safe API endpoints defined in `src/server/api/routers/`:

- **`exercises.ts`**: Exercise CRUD operations (list, filteredList, byId, create, update, delete)
- **`sequences.ts`**: Sequence management (list, byId, create, update, delete, duplicate, toggleFavorite, calculateDuration)
- **`executions.ts`**: Execution tracking (start, updateExecution, submitRating, getUserStats, getHistory, getDetailedStats, getWeeklyProgress, exportData)
- **`settings.ts`**: User settings management (get, update, calculateStreak, checkBadges)

### Frontend Structure

- **`src/routes/`**: TanStack Router file-based routing

  - `__root.tsx`: Root layout with MainNav
  - `index.tsx`: Home page
  - `exercises/index.tsx`: Exercise management
  - `sequences/index.tsx`: Sequence builder
  - `settings/index.tsx`: User settings
  - `onboarding/index.tsx`: Initial setup flow

- **`src/components/`**: React components

  - `ui/`: Radix UI-based design system components
  - `navigation/`: Navigation components (MainNav)
  - Domain components: ExerciseList, ExerciseForm, SequenceList, ExecuteSequence, Settings

- **`src/router.tsx`**: Router configuration with TanStack Query
- **`src/lib/trpc.ts`**: tRPC client setup

### Data Flow

1. Frontend components use tRPC hooks (`trpc.*.useQuery()`, `trpc.*.useMutation()`)
2. tRPC provides end-to-end type safety from database to UI
3. All API routes use `protectedProcedure` which validates Clerk session
4. Query invalidation via `trpc.useUtils()` keeps UI in sync
5. Soft deletes are used (via `deletedAt` field) rather than hard deletes

### Authentication

- Uses Clerk for authentication
- `protectedProcedure` in tRPC checks Clerk session via `getAuth()`
- `userId` from Clerk is stored as `clerkId` in database
- All user data is scoped by `userId` with indexes on `user_id`

## Key Patterns

### tRPC Patterns

1. **Router structure**:

   ```typescript
   export const myRouter = {
     list: protectedProcedure.query(async ({ ctx }) => {
       return await db.select().from(table).where(eq(table.userId, ctx.userId));
     }),

     create: protectedProcedure
       .input(createInputSchema)
       .mutation(async ({ ctx, input }) => {
         return await db.insert(table).values({ ...input, userId: ctx.userId });
       }),
   } satisfies TRPCRouterRecord;
   ```

2. **Use protectedProcedure for auth**: All user-specific endpoints should use `protectedProcedure` which validates Clerk session

3. **Input validation**: Use Zod schemas from `src/validators/api/` for all procedure inputs

4. **Query invalidation**: After mutations, invalidate related queries using `trpc.useUtils()`

### Drizzle ORM Patterns

1. **Queries with conditions**:

   ```typescript
   await db
     .select()
     .from(table)
     .where(and(eq(table.userId, userId), isNull(table.deletedAt)));
   ```

2. **Soft deletes**: Filter out soft-deleted records with `isNull(table.deletedAt)`

3. **Type safety**: Drizzle provides full TypeScript inference for queries

4. **Indexes**: Use `.withIndex()` is not needed - indexes are defined in schema

## Project-Specific Patterns

### Exercise Configuration

Exercises in sequences have a configuration object:

```typescript
{
  goal: 'strict' | 'elastic',  // Strict = exact target, Elastic = flexible
  measure: 'repetitions' | 'time',  // How to measure completion
  targetValue?: number  // Optional target (reps or seconds)
}
```

### Soft Deletes

All deletable entities use soft delete pattern with `deletedAt: timestamp('deleted_at')` field. Filter these out in queries:

```typescript
await db
  .select()
  .from(table)
  .where(and(eq(table.userId, userId), isNull(table.deletedAt)));
```

### Media Storage

This app uses URL-based storage (no file uploads):

1. Exercises have `photoUrls` and `videoUrls` as text array columns
2. Users provide URLs to external media (YouTube, Imgur, etc.)
3. Links can be added to `links` array for additional resources

## Environment Variables

This project uses **@t3-oss/env-core** for type-safe environment variable validation.

### Configuration

All environment variables are validated in `src/env.ts`:

```typescript
import { env } from "./env";

// Type-safe access to validated environment variables
const databaseUrl = env.DATABASE_URL;
const clerkKey = env.VITE_CLERK_PUBLISHABLE_KEY;
```

### Required Variables

Required in `.env.local`:

- `DATABASE_URL`: Neon Postgres connection string (validated as URL)
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk publishable key (validated as non-empty string)
- `CLERK_SECRET_KEY`: Clerk secret key for server-side auth

### Adding New Environment Variables

1. Add the variable to your `.env.local` file
2. For client-side variables: use `VITE_` prefix and add to `client` object in `src/env.ts`
3. For server-side variables: add to `server` object in `src/env.ts`
4. Access via the type-safe `env` object imported from `~/env`

Note:

- Client-side environment variables **must** be prefixed with `VITE_` for Vite to expose them to the frontend
- Server-side variables (like `DATABASE_URL`, `CLERK_SECRET_KEY`) should NOT have the `VITE_` prefix for security

## Path Aliases

TypeScript paths configured in `tsconfig.json`:

- `~/*` or `@/*` → `./src/*`
