import { Link, useLocation } from '@tanstack/react-router'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { WifiOff } from 'lucide-react'
import { UserButton, SignedIn, SignedOut } from '@/components/auth'

export function MainNav() {
  const location = useLocation()
  const isOnline = useOnlineStatus()

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/exercises', label: 'Exercises' },
    { to: '/sequences', label: 'Sequences' },
    { to: '/settings', label: 'Settings' },
  ]

  return (
    <>
      {!isOnline && (
        <div className="fixed bottom-16 left-0 right-0 bg-orange-500 text-white px-4 py-2 text-center text-sm z-50">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span>You're offline. Changes will sync when reconnected.</span>
          </div>
        </div>
      )}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="flex h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={`Navigate to ${item.label}`}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 flex items-center justify-center gap-2 px-2 py-4 text-xs font-medium transition-colors hover:bg-muted ${
                  isActive ? 'bg-muted text-primary' : 'text-muted-foreground'
                }`}
              >
                <span>{item.label}</span>
              </Link>
            )
          })}
          <div className="flex items-center justify-center px-2">
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <Link
                to="/login"
                className="text-xs font-medium text-muted-foreground hover:text-primary"
              >
                Sign In
              </Link>
            </SignedOut>
          </div>
        </div>
      </nav>
    </>
  )
}
