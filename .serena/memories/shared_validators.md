# Shared Validators Architecture

## Overview

This project uses a centralized validator architecture to ensure consistency between backend validation (tRPC) and frontend validation (TanStack Form).

## Core Principles

### Single Source of Truth
**CRITICAL**: Validators should NEVER be redeclared. Always import and reuse validators from the centralized location.

### Directory Structure

All validators are organized by router domain in `src/validators/api/{domain}.ts`:

```
src/validators/api/
├── exercises.ts   (5 validators)
├── sequences.ts   (7 validators)
├── executions.ts  (5 validators)
└── settings.ts    (1 validator)
```

**One file per router** - All validators for a domain live together in a single file. This keeps things simple and easy to navigate. If a domain grows significantly, validators can be split into separate files later.

## Naming Convention

### Validator Naming
- **Query/Input validators**: `{operation}{Domain}InputValidator`
  - Example: `getExerciseByIdInputValidator`
  - Example: `getFilteredExercisesInputValidator`
  - Example: `deleteSequenceInputValidator`

- **Create/Update validators**: `{operation}{Domain}InputValidator`
  - Example: `createExerciseInputValidator`
  - Example: `updateSequenceInputValidator`

### TypeScript Type Naming
- Export inferred types with pattern: `{Operation}{Domain}Input`
  - Example: `export type GetExerciseByIdInput = z.infer<typeof getExerciseByIdInputValidator>`

## Validator Patterns

### Query Parameter Validators
Simple validators for route parameters or query strings:

```typescript
import { z } from 'zod'

export const getExerciseByIdInputValidator = z.object({
  id: z.number(),
})

export type GetExerciseByIdInput = z.infer<typeof getExerciseByIdInputValidator>
```

### Create/Update Validators (drizzle-zod)
Use drizzle-zod schemas with omitted auto-managed fields:

```typescript
import { z } from 'zod'
import { insertExerciseSchema, updateExerciseSchema } from '~/db/schemas'

export const createExerciseInputValidator = insertExerciseSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  deletedAt: true,
})

export type CreateExerciseInput = z.infer<typeof createExerciseInputValidator>
```

### Complex Nested Validators
For operations with complex nested data:

```typescript
import { z } from 'zod'

export const updateExecutionInputValidator = z.object({
  id: z.number(),
  exercises: z.array(
    z.object({
      exerciseId: z.union([z.number(), z.literal('break')]),
      startedAt: z.date(),
      completedAt: z.date().optional(),
      value: z.number().optional(),
      skipped: z.boolean().optional(),
    }),
  ),
  pausedAt: z.date().optional(),
  totalPauseDuration: z.number(),
  completedAt: z.date().optional(),
})

export type UpdateExecutionInput = z.infer<typeof updateExecutionInputValidator>
```

### File Organization
All validators for a router domain are grouped in one file:

```typescript
// src/validators/api/exercises.ts
import { z } from 'zod'
import { insertExerciseSchema, updateExerciseSchema } from '~/db/schemas'
import { Level, Category, BodyPart } from '~/db/types'

export const getFilteredExercisesInputValidator = z.object({
  level: Level.optional(),
  category: Category.optional(),
  bodyPart: BodyPart.optional(),
})

export type GetFilteredExercisesInput = z.infer<typeof getFilteredExercisesInputValidator>

export const createExerciseInputValidator = insertExerciseSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  deletedAt: true,
})

export type CreateExerciseInput = z.infer<typeof createExerciseInputValidator>

// ... other exercise validators
```

## Usage

### In tRPC Routers
Import all validators from the domain file:

```typescript
import {
  getFilteredExercisesInputValidator,
  getExerciseByIdInputValidator,
  createExerciseInputValidator,
  updateExerciseInputValidator,
  deleteExerciseInputValidator,
} from '~/validators/api/exercises'

export const exercisesRouter = {
  filteredList: protectedProcedure
    .input(getFilteredExercisesInputValidator)
    .query(async ({ ctx, input }) => {
      // Implementation
    }),

  byId: protectedProcedure
    .input(getExerciseByIdInputValidator)
    .query(async ({ ctx, input }) => {
      // Implementation
    }),

  create: protectedProcedure
    .input(createExerciseInputValidator)
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
}
```

### In Frontend Forms (TanStack Form)
Import validators from the domain file:

```typescript
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { createExerciseInputValidator, type CreateExerciseInput } from '~/validators/api/exercises'

function ExerciseForm() {
  const form = useForm<CreateExerciseInput>({
    defaultValues: {
      name: '',
      level: 'beginner',
      // ... other fields
    },
    onSubmit: async ({ value }) => {
      await createExercise.mutateAsync(value)
    },
  })

  return (
    <form.Field
      name="name"
      validators={{
        onChange: zodValidator(createExerciseInputValidator.shape.name),
      }}
    >
      {/* Field component */}
    </form.Field>
  )
}
```

## Benefits

1. **Type Safety**: Single source of truth ensures backend and frontend stay in sync
2. **No Duplication**: Validators are defined once and reused everywhere
3. **Easy Refactoring**: Change validation rules in one place
4. **Consistent UX**: Same validation on client and server prevents surprises
5. **Leverage drizzle-zod**: Automatically generate validators from database schema

## Anti-Patterns to Avoid

❌ **DO NOT redeclare validators inline**:
```typescript
// BAD - inline schema in router
byId: protectedProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ ctx, input }) => { /* ... */ })
```

✅ **DO use centralized validators**:
```typescript
// GOOD - import from validators
import { getExerciseByIdInputValidator } from '~/validators/api/exercises'

byId: protectedProcedure
  .input(getExerciseByIdInputValidator)
  .query(async ({ ctx, input }) => { /* ... */ })
```

❌ **DO NOT duplicate validators in forms**:
```typescript
// BAD - duplicating schema in form
const formSchema = z.object({
  name: z.string(),
  level: Level,
  // ...
})
```

✅ **DO reuse API validators in forms**:
```typescript
// GOOD - reuse from centralized validators
import { createExerciseInputValidator } from '~/validators/api/exercises'

form.Field({
  validators: {
    onChange: zodValidator(createExerciseInputValidator.shape.name),
  },
})
```

## Migration Completed

All tRPC routers have been migrated to use shared validators:
- ✅ exercises router (5 procedures) - `src/validators/api/exercises.ts`
- ✅ sequences router (7 procedures) - `src/validators/api/sequences.ts`
- ✅ executions router (5 procedures) - `src/validators/api/executions.ts`
- ✅ settings router (1 procedure) - `src/validators/api/settings.ts`

Total: 18 procedures across 4 validator files

**Future Growth**: If any domain grows significantly (e.g., 15+ validators), consider splitting into separate files per operation. Until then, keep all validators for a domain in one file for simplicity.
