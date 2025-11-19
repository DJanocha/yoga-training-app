import { createTRPCContext } from '@trpc/tanstack-react-query'
import type { AppRouter } from '../server/api'

export const { TRPCProvider,useTRPC } = createTRPCContext<AppRouter>()