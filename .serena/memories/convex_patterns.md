# Convex Patterns & Best Practices

## Required Function Syntax

Always use the new Convex function syntax with validators:

```typescript
export const myQuery = query({
  args: { id: v.id('tableName') },
  returns: v.string(),
  handler: async (ctx, args) => {
    // implementation
  },
})
```

**Critical**: Both `args` and `returns` validators are REQUIRED. Use `returns: v.null()` if no return value.

## Authentication Pattern

All user-facing functions should authenticate:

```typescript
import { getAuthUserId } from '@convex-dev/auth/server'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return [] // or throw/return null
    
    // User-scoped query
    return await ctx.db
      .query('exercises')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
  },
})
```

## Database Query Patterns

### Use Indexes (Performance)
```typescript
// GOOD - Uses index
.withIndex('by_user', (q) => q.eq('userId', userId))

// BAD - Scans entire table
.filter((q) => q.eq(q.field('userId'), userId))
```

### Single Document Retrieval
```typescript
// Use .unique() for indexed unique queries (throws if multiple)
const setting = await ctx.db
  .query('userSettings')
  .withIndex('by_user', (q) => q.eq('userId', userId))
  .unique()

// Use .first() for optional single result
const latest = await ctx.db
  .query('exercises')
  .withIndex('by_user')
  .first()

// Use .get() for direct ID lookup
const exercise = await ctx.db.get(exerciseId)
```

### Materialization
```typescript
// .collect() - Get all results
const all = await ctx.db.query('exercises').collect()

// .take(n) - Get first n results
const first10 = await ctx.db.query('exercises').take(10)
```

### Default Ordering
Results are ordered by `_creationTime` ascending by default.

## Soft Delete Pattern

All deletable entities use soft deletes:

```typescript
// Schema
deletedAt: v.optional(v.number())

// Always filter in queries
.filter((q) => q.eq(q.field('deletedAt'), undefined))

// Soft delete mutation
export const softDelete = mutation({
  args: { id: v.id('exercises') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthorized')
    
    const exercise = await ctx.db.get(args.id)
    if (!exercise || exercise.userId !== userId) {
      throw new Error('Not found')
    }
    
    await ctx.db.patch(args.id, { deletedAt: Date.now() })
  },
})
```

## File Storage Pattern

### Upload Flow
1. Generate upload URL
2. Client uploads to URL
3. Get storage ID from response
4. Save storage ID in database

```typescript
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    photo: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthorized')
    
    const exerciseId = await ctx.db.insert('exercises', {
      ...args,
      userId,
    })
    return exerciseId
  },
})
```

### Retrieving Files
```typescript
// Get signed URL (null if not found)
const photoUrl = exercise.photo 
  ? await ctx.storage.getUrl(exercise.photo)
  : null

// Get file metadata
const metadata = await ctx.db.system.get(storageId)
```

## Function Types

### Public Functions
```typescript
import { query, mutation, action } from './_generated/server'

// Accessible via api.moduleName.functionName
export const myQuery = query({ /* ... */ })
export const myMutation = mutation({ /* ... */ })
export const myAction = action({ /* ... */ })
```

### Internal Functions
```typescript
import { internalQuery, internalMutation, internalAction } from './_generated/server'

// Accessible via internal.moduleName.functionName
export const myInternal = internalQuery({ /* ... */ })
```

## Type Safety

### ID Types
```typescript
import type { Id } from './_generated/dataModel'

// Type-safe IDs
const exerciseId: Id<'exercises'> = args.id
```

### Document Types
```typescript
import type { Doc } from './_generated/dataModel'

const exercise: Doc<'exercises'> = await ctx.db.get(exerciseId)
```

### Validators
```typescript
import { v } from 'convex/values'

// Common validators
v.string()
v.number()
v.boolean()
v.null()
v.id('tableName')
v.optional(v.string())
v.array(v.object({ /* ... */ }))
v.union(v.literal('a'), v.literal('b'))
```

## Error Handling

```typescript
// Throw errors for client handling
if (!userId) {
  throw new Error('Unauthorized')
}

if (!document) {
  throw new Error('Document not found')
}

// Return null for optional data
if (!userId) return null
```

## Project-Specific Patterns

### Exercise Configuration
```typescript
{
  exerciseId: v.id('exercises'),
  goal: v.union(v.literal('strict'), v.literal('elastic')),
  measure: v.union(v.literal('repetitions'), v.literal('time')),
  targetValue: v.optional(v.number()),
}
```

### Sequence Execution
```typescript
{
  sequenceId: v.id('sequences'),
  userId: v.string(),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
  exerciseCompletions: v.array(v.object({
    exerciseId: v.id('exercises'),
    completedValue: v.number(),
    notes: v.optional(v.string()),
  })),
}
```

## Common Antipatterns to Avoid

❌ **Old function syntax**
```typescript
export default query(async (ctx, args: { id: Id<'exercises'> }) => {
  // Missing validators!
})
```

✅ **New function syntax**
```typescript
export const get = query({
  args: { id: v.id('exercises') },
  returns: v.union(v.object({ /* ... */ }), v.null()),
  handler: async (ctx, args) => {
    // ...
  },
})
```

❌ **Not filtering soft deletes**
❌ **Using .filter() instead of .withIndex()**
❌ **Forgetting authentication checks**
❌ **Not returning null for unauthenticated requests**