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
import { DefaultCatchBoundary } from '@/components/DefaultCatchBoundary'
import { NotFound } from '@/components/NotFound'
import { ThemeProvider } from '@/components/theme-provider'

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
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      {
        title: 'Yoga Training',
      },
      // PWA meta tags for iOS Safari
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'default',
      },
      {
        name: 'apple-mobile-web-app-title',
        content: 'Yoga',
      },
      {
        name: 'mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'theme-color',
        content: '#000000',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
      {
        rel: 'apple-touch-icon',
        href: '/logo192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        href: '/logo192.png',
      },
    ],
  }),
  component: RootComponent,
  errorComponent: ({ error, reset }) => (
    <RootDocument>
      <DefaultCatchBoundary error={error} reset={reset} />
    </RootDocument>
  ),
  notFoundComponent: () => (
    <RootDocument>
      <NotFound />
    </RootDocument>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('yoga-theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
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
