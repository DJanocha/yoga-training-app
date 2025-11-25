import { QueryClient } from '@tanstack/react-query'
import superjson from 'superjson'
import { createTRPCClient, httpBatchStreamLink } from '@trpc/client'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'

import type { AppRouter } from '../../server/api'

import { TRPCProvider } from '../../lib/trpc'
import { QueryClientProvider } from '@tanstack/react-query'
import { env } from '@/env'

import { AuthQueryProvider } from '@daveyplate/better-auth-tanstack'
import { AuthUIProviderTanstack } from '@daveyplate/better-auth-ui/tanstack'
import { authClient } from '@/lib/auth-client'
import { Link as RouterLink } from '@tanstack/react-router'

// Create a wrapper for Link that better-auth-ui can use
const Link = (props: { href: string; className?: string; children: React.ReactNode }) => (
  <RouterLink to={props.href} className={props.className}>
    {props.children}
  </RouterLink>
)

function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return ''
    return `http://localhost:${env.PORT}`
  })()
  return `${base}/api/trpc`
}

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchStreamLink({
      transformer: superjson,
      url: getUrl(),
    }),
  ],
})

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      dehydrate: { serializeData: superjson.serialize },
      hydrate: { deserializeData: superjson.deserialize },
    },
  })

  const serverHelpers = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient: queryClient,
  })
  return {
    queryClient,
    trpc: serverHelpers,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthQueryProvider>
          <AuthUIProviderTanstack
            authClient={authClient}
            settingsURL="/account/settings"
            navigate={(href: string) => {
              // Use window.location for auth navigation to ensure clean redirects
              window.location.href = href
            }}
            replace={(href: string) => {
              window.location.replace(href)
            }}
            onSessionChange={() => {
              // Invalidate all queries when auth state changes
              queryClient.invalidateQueries()
            }}
            Link={Link}
          >
            {children}
          </AuthUIProviderTanstack>
        </AuthQueryProvider>
      </QueryClientProvider>
    </TRPCProvider>
  )
}
