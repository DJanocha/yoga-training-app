# Schema Organization Pattern

This document describes the schema organization pattern used in the yoga-training-app-v2 project.

## Directory Structure

```
src/
├── db/
│   ├── schema.ts     → Drizzle table definitions (PostgreSQL)
│   ├── types.ts      → Shared TypeScript types and Zod enums
│   └── index.ts      → Database connection (Neon)
│
└── validators/
    ├── entities.ts   → Entity Zod schemas (insert/select/update)
    └── api/
        ├── exercises.ts  → tRPC input validators for exercises router
        ├── sequences.ts  → tRPC input validators for sequences router
        ├── executions.ts → tRPC input validators for executions router
        └── settings.ts   → tRPC input validators for settings router
```

## File Responsibilities

### `db/schema.ts`

- Drizzle ORM table definitions only
- No Zod schemas here
- Exports table objects (user, exercises, sequences, etc.)

### `db/types.ts`

- Shared TypeScript types and enums
- Zod schemas for enum values (Level, Category, BodyPart, Theme, etc.)
- Refined schemas for complex fields (refinedExerciseSchema, refinedSequenceSchema)
- Type definitions for JSONB fields (SequenceExercise, ExecutionExercise, etc.)

### `validators/entities.ts`

- All entity Zod schemas derived from Drizzle tables
- Uses `createInsertSchema` and `createSelectSchema` from drizzle-zod
- Merges base schemas with refined schemas from `db/types.ts`
- Exports:
  - Insert schemas (e.g., `insertExerciseSchema`)
  - Select schemas (e.g., `selectExerciseSchema`)
  - Update schemas (e.g., `updateExerciseSchema`)
  - TypeScript types inferred from schemas

### `validators/api/*.ts`

- tRPC procedure input validators
- Derive from entity schemas in `../entities`
- Use `.omit()` to remove auto-managed fields
- Naming convention: `*InputValidator` (e.g., `createExerciseInputValidator`)
- Export corresponding TypeScript types

## Adding a New Entity

1. **Define the table** in `db/schema.ts`:

   ```typescript
   export const myEntity = pgTable("my_entities", {
     id: serial("id").primaryKey(),
     userId: text("user_id").notNull(),
     name: text("name").notNull(),
     // ... other fields
   });
   ```

2. **Add types/enums** to `db/types.ts` (if needed):

   ```typescript
   export const MyEnum = z.enum(["value1", "value2", "value3"]);
   export type MyEnumType = z.infer<typeof MyEnum>;
   ```

3. **Create entity schemas** in `validators/entities.ts`:

   ```typescript
   import { myEntity } from "@/db/schema";

   export const insertMyEntitySchema = createInsertSchema(myEntity);
   export const selectMyEntitySchema = createSelectSchema(myEntity);
   export const updateMyEntitySchema = insertMyEntitySchema
     .partial()
     .required({ id: true });

   export type MyEntity = z.infer<typeof selectMyEntitySchema>;
   export type InsertMyEntity = z.infer<typeof insertMyEntitySchema>;
   export type UpdateMyEntity = z.infer<typeof updateMyEntitySchema>;
   ```

4. **Create API validators** in `validators/api/my-entity.ts`:

   ```typescript
   import { z } from "zod";
   import { insertMyEntitySchema, updateMyEntitySchema } from "../entities";

   export const getMyEntityByIdInputValidator = z.object({
     id: z.number(),
   });

   export const createMyEntityInputValidator = insertMyEntitySchema.omit({
     id: true,
     userId: true,
     createdAt: true,
   });

   export const updateMyEntityInputValidator = updateMyEntitySchema.omit({
     userId: true,
     createdAt: true,
   });

   // Export types
   export type GetMyEntityByIdInput = z.infer<
     typeof getMyEntityByIdInputValidator
   >;
   export type CreateMyEntityInput = z.infer<
     typeof createMyEntityInputValidator
   >;
   export type UpdateMyEntityInput = z.infer<
     typeof updateMyEntityInputValidator
   >;
   ```

## Best Practices

1. **Single source of truth**: Entity schemas live in `validators/entities.ts`
2. **Derive, don't duplicate**: API validators use `.omit()` from entity schemas
3. **Consistent naming**:
   - Entity schemas: `insert*Schema`, `select*Schema`, `update*Schema`
   - API validators: `*InputValidator`
4. **Auto-managed fields**: Always omit `id`, `userId`, `createdAt`, `deletedAt` in create validators
5. **Type exports**: Always export TypeScript types alongside validators

## Import Patterns

```typescript
// In tRPC routers
import { createMyEntityInputValidator } from "@/validators/api/my-entity";

// In components needing entity types
import type { MyEntity, InsertMyEntity } from "@/validators/entities";

// In db queries
import { myEntity } from "@/db/schema";
```
