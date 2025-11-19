# Clerk + TanStack Start Compatibility Issues

## Problem
When using Clerk with TanStack Start, you may encounter a 500 error with the following symptoms:
- Error: `TypeError: Cannot read properties of undefined (reading 'get')`
- Error location: `AuthenticateContext.getCookie` in `@clerk/backend`
- HTTP Status: 500 with `{"status":500,"unhandled":true,"message":"HTTPError"}`

## Root Cause
Compatibility issue between Clerk middleware and TanStack Start's request handling, particularly around cookie management. The middleware expects a different request context structure than what TanStack Start provides.

## Solution
Found via GitHub issue: https://github.com/clerk/javascript/issues/6996
Specific fix comment: https://github.com/clerk/javascript/issues/6996#issuecomment-3411508929

The solution involves installing a specific version of `srvx` that fixes the compatibility issue:

```bash
pnpm add srvx@0.8.15
```

This version of srvx resolves the cookie handling incompatibility between Clerk's middleware and TanStack Start's request handling.

## Search Terms for Future Reference
- `tanstack clerk {"status":500,"unhandled":true,"message":"HTTPError"}`
- `TypeError: Cannot read properties of undefined (reading 'get') AuthenticateContext`
- `@clerk/tanstack-react-start cookie error`

## Package Versions Affected
- `@clerk/tanstack-react-start`: 0.27.2-snapshot.v20251113231557
- `@tanstack/react-start`: 1.136.8

## Implementation
The Clerk middleware should be used normally in `src/start.ts`:
```typescript
import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createStart } from '@tanstack/react-start'

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [clerkMiddleware()],
  }
})
```

## Date Documented
2025-11-19