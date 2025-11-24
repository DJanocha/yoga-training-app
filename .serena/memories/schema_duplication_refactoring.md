# Schema Duplication Refactoring Needed

## Problem
There are duplicate/overlapping Zod schemas in two locations:
1. `src/db/schemas.ts` - Generated from Drizzle + refined schemas
2. `src/validators/api/*.ts` - API-specific input validators

## Current State
- `src/db/schemas.ts` has base schemas from drizzle-zod and refined schemas merged
- `src/validators/api/exercises.ts`, `sequences.ts`, `settings.ts`, `executions.ts` have additional validators

## Issues
- Some validators in `validators/api/` duplicate what's in `db/schemas.ts`
- Not clear which one to use when they don't match 1:1
- Risk of schemas getting out of sync

## Recommended Approach
1. Keep `src/db/schemas.ts` as the source of truth for entity schemas
2. `src/validators/api/*.ts` should only contain:
   - Input validators that `.omit()` or `.pick()` from base schemas
   - Composite validators for specific API operations
   - Should NOT redefine field validations
3. Remove duplicate field definitions from `validators/api/*.ts`

## Files to Review
- `src/validators/api/executions.ts` - has inline schemas that could reference types.ts
- `src/validators/api/exercises.ts` - uses omit pattern correctly
- `src/validators/api/sequences.ts` - uses omit pattern correctly
- `src/validators/api/settings.ts` - needs review

## Action Items
- [ ] Audit all validators/api/*.ts files
- [ ] Replace inline z.object() definitions with references to db/types.ts
- [ ] Ensure consistent naming convention
- [ ] Document the pattern for future additions
