import { Link, useLocation, useMatch } from '@tanstack/react-router'
import { Home, Dumbbell, ListOrdered, LogOut, WifiOff, User, Calendar, Trophy, SlidersHorizontal, Package2 } from 'lucide-react'
import { UserButton, SignedIn, SignedOut } from '@/components/auth'

import { useIsMobile } from '@/hooks/use-mobile'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'
import { ThemeToggle } from '@/components/theme-toggle'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/exercises', label: 'Exercises', icon: Dumbbell },
  { to: '/sequences', label: 'Sequences', icon: ListOrdered },
  { to: '/modifiers', label: 'Modifiers', icon: Package2 },
  { to: '/history', label: 'History', icon: Calendar },
  { to: '/achievements', label: 'Achievements', icon: Trophy },
  { to: '/preferences', label: 'Preferences', icon: SlidersHorizontal },
] as const

function DesktopSidebar() {
  const location = useLocation()
  const { data: session } = authClient.useSession()

  const handleSignOut = async () => {
    await authClient.signOut()
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            Y
          </div>
          <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
            Yoga Training
          </span>
          <div className="ml-auto group-data-[collapsible=icon]:hidden">
            <ThemeToggle />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.to
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link to={item.to}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SignedIn>
          <div className="flex items-center gap-2 px-2">
            <UserButton />
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium truncate">
                {session?.user?.name ?? 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session?.user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 group-data-[collapsible=icon]:hidden"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SignedIn>
        <SignedOut>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/login">
                  <span>Sign In</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SignedOut>
      </SidebarFooter>
    </Sidebar>
  )
}

function MobileTabBar() {
  const location = useLocation()

  // Hide tab bar during focused task modes to prevent accidental navigation
  // - /execute: workout execution
  // - /edit: sequence builder (has its own dock)
  const isExecuting = location.pathname.includes('/execute')
  const isEditing = location.pathname.includes('/edit')
  if (isExecuting || isEditing) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t bg-background md:hidden">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to
        const Icon = item.icon
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex h-full flex-1 items-center justify-center transition-colors',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={item.label}
          >
            <Icon className="h-6 w-6" />
          </Link>
        )
      })}

      {/* User tab */}
      <SignedIn>
        <div className="flex h-full flex-1 items-center justify-center">
          <UserButton size="icon"/>
        </div>
      </SignedIn>
      <SignedOut>
        <Link
          to="/login"
          className={cn(
            'flex h-full flex-1 items-center justify-center transition-colors',
            location.pathname === '/login'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label="Sign in"
        >
          <User className="h-6 w-6" />
        </Link>
      </SignedOut>
    </nav>
  )
}

function OfflineIndicator() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed bottom-14 left-0 right-0 bg-orange-500 text-white px-4 py-2 text-center text-sm z-40 md:bottom-0 md:left-(--sidebar-width)">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>You're offline. Changes will sync when reconnected.</span>
      </div>
    </div>
  )
}

export function AppSidebarLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()

  // Check if we're on the execute route (mobile tab bar is hidden there)
  const isExecuting = useMatch({ from: '/sequences/$id/execute', shouldThrow: false })

  return (
    <SidebarProvider>
      {/* Desktop Sidebar */}
      {!isMobile && <DesktopSidebar />}

      <SidebarInset>
        {/* Main Content - less bottom padding when executing (no tab bar) */}
        <div className={`flex-1 px-4 md:px-6 md:pb-6 ${isExecuting ? 'pb-4' : 'pb-16'}`}>
          {children}
        </div>

        <OfflineIndicator />

        {/* Mobile Tab Bar */}
        <MobileTabBar />
      </SidebarInset>
    </SidebarProvider>
  )
}
