import { Link, useLocation } from '@tanstack/react-router'
import { Home, Dumbbell, ListOrdered, Settings, Menu, LogOut, WifiOff } from 'lucide-react'
import { UserButton, SignedIn, SignedOut } from 'better-auth-ui'

import { useIsMobile } from '@/hooks/use-mobile'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'
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
  useSidebar,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { authClient } from '@/lib/auth-client'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/exercises', label: 'Exercises', icon: Dumbbell },
  { to: '/sequences', label: 'Sequences', icon: ListOrdered },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

function MobileBottomDrawer() {
  const { openMobile, setOpenMobile } = useSidebar()
  const location = useLocation()

  return (
    <Drawer open={openMobile} onOpenChange={setOpenMobile}>
      <DrawerContent className="max-h-[85vh] px-0">
        <DrawerHeader className="px-6 pb-2">
          <DrawerTitle className="text-left">Menu</DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col">
          {/* Navigation Items */}
          <nav className="px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to
              const Icon = item.icon
              return (
                <DrawerClose asChild key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      'flex items-center gap-4 px-4 py-4 rounded-lg transition-colors',
                      'text-base font-medium',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </DrawerClose>
              )
            })}
          </nav>

          <Separator className="my-4" />

          {/* User Section */}
          <div className="px-2 pb-2">
            <SignedIn>
                  <UserButton  className='w-full'/>
            </SignedIn>
            <SignedOut>
              <DrawerClose asChild>
                <Link
                  to="/login"
                  className="flex items-center justify-center w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium"
                >
                  Sign In
                </Link>
              </DrawerClose>
            </SignedOut>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

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

function MobileBottomBar() {
  const { toggleSidebar, openMobile } = useSidebar()

  // Hide when drawer is open
  if (openMobile) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] flex h-16 items-center justify-between border-t bg-background px-4 md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          Y
        </div>
        <span className="font-semibold">Yoga Training</span>
      </div>
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-10 w-10">
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle menu</span>
      </Button>
    </nav>
  )
}

function OfflineIndicator() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-orange-500 text-white px-4 py-2 text-center text-sm z-50 md:bottom-0 md:left-(--sidebar-width)">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>You're offline. Changes will sync when reconnected.</span>
      </div>
    </div>
  )
}

export function AppSidebarLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()

  return (
    <SidebarProvider>
      {/* Desktop Sidebar */}
      {!isMobile && <DesktopSidebar />}

      {/* Mobile Bottom Drawer */}
      {isMobile && <MobileBottomDrawer />}

      <SidebarInset>
        {/* Main Content */}
        <div className="flex-1 px-4 py-6 pb-2 md:px-6 md:pb-6">
          {children}
        </div>

        <OfflineIndicator />

        {/* Mobile Bottom Bar */}
        <MobileBottomBar />
      </SidebarInset>
    </SidebarProvider>
  )
}

export { useSidebar }
