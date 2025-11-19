import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createStart } from '@tanstack/react-start'

export const startInstance = createStart(() => {
  return {
    // Temporarily disable Clerk middleware due to compatibility issues
    // with the snapshot version
    requestMiddleware: [],
    // requestMiddleware: [clerkMiddleware()],
  }
})
