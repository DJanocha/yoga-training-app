import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useLocation,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

import type { AppRouter } from '../server/api'
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query'

import { Toaster } from '@/components/ui/sonner'
import { AppSidebarLayout } from '@/components/app-sidebar'

interface MyRouterContext {
  queryClient: QueryClient

  trpc: TRPCOptionsProxy<AppRouter>
}

// Routes that should NOT show the sidebar navigation
const noSidebarRoutes = ['/login', '/auth', '/onboarding']

function RootComponent() {
  const location = useLocation()
  const shouldShowSidebar = !noSidebarRoutes.some(route =>
    location.pathname === route || location.pathname.startsWith(`${route}/`)
  )

  if (shouldShowSidebar) {
    return (
      <AppSidebarLayout>
        <Outlet />
      </AppSidebarLayout>
    )
  }

  return <Outlet />
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Yoga Training',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
  errorComponent: (props) => {
    return <RootDocument>{props.error.message}</RootDocument>
  },
  notFoundComponent: () => (
    <RootDocument>
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Page not found</h1>
      </div>
    </RootDocument>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
