# Code Style & Conventions

## Prettier Configuration

```json
{
  "semi": false, // No semicolons
  "singleQuote": true, // Use single quotes
  "trailingComma": "all" // Trailing commas everywhere
}
```

## TypeScript Configuration

### Compiler Options

- **Strict mode**: Enabled
- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **JSX**: react-jsx (automatic runtime)
- **noUnusedLocals**: true
- **noUnusedParameters**: true
- **noFallthroughCasesInSwitch**: true
- **verbatimModuleSyntax**: true

### Path Aliases

```typescript
// Both aliases work:
import { something } from "@/lib/utils";
import { something } from "@/lib/utils";
// Both resolve to: ./src/lib/utils
```

## Code Style Guidelines

### General TypeScript

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use template literals for string interpolation
- Use arrow functions for callbacks
- Named exports preferred over default exports (except for route files)
- Always include type annotations for function parameters and returns
- Use `type` for object shapes, `interface` for extensible contracts

### React Components

- **Naming**: PascalCase for components (e.g., `ExerciseList`)
- **Files**: `.tsx` extension for components
- **Structure**: Named export functions
- **Props**: Define inline type or separate type definition
- **Hooks**: Follow Rules of Hooks (top-level only)

Example:

```typescript
export function ExerciseList() {
  const exercises = useQuery(api.exercises.list);
  // ...
}
```

### Convex Functions

#### New Function Syntax (Required)

Always use the new Convex function syntax with args and returns validators:

```typescript
export const myQuery = query({
  args: { id: v.id("tableName") },
  returns: v.string(),
  handler: async (ctx, args) => {
    // implementation
  },
});
```

#### Key Patterns

- **Always include validators**: Both `args` and `returns` are required
- Use `returns: v.null()` if no return value
- **Authentication**: Use `getAuthUserId(ctx)` for user identification
- **Database queries**: Prefer `.withIndex()` over `.filter()` for performance
- Use `.unique()` for single document retrieval
- Use `.collect()` or `.take(n)` to materialize results
- **Soft deletes**: Filter with `.filter((q) => q.eq(q.field('deletedAt'), undefined))`

#### Public vs Internal

- `query`, `mutation`, `action` for public API
- `internalQuery`, `internalMutation`, `internalAction` for internal functions
- Access via `api.*` or `internal.*` from `convex/_generated/api`

Example:

```typescript
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("exercises")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});
```

### File Naming

- **Components**: PascalCase.tsx (e.g., `ExerciseList.tsx`)
- **Utilities**: kebab-case.ts (e.g., `use-mobile.ts`)
- **Routes**: kebab-case.tsx or index.tsx
- **Convex**: camelCase.ts (e.g., `exercises.ts`)

### Imports

- Organize imports: external libraries first, then internal imports
- Use path aliases for internal imports: `~/components/ui/button`
- Group related imports

### Styling

- **Tailwind CSS**: Use utility classes
- **Class Names**: Use `clsx` or `tailwind-merge` for conditional classes
- **Component Variants**: Use `class-variance-authority` for variant patterns
- **Responsive**: Mobile-first approach with sm:, md:, lg: breakpoints

### Comments

- Use JSDoc comments for public functions
- Inline comments for complex logic
- Avoid obvious comments
- Prefer self-documenting code

## ESLint Configuration

- **TanStack Config**: @tanstack/eslint-config
- **Convex Plugin**: @convex-dev/eslint-plugin (recommended rules)
- **Ignored**: convex/\_generated directory
