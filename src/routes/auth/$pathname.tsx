import { createFileRoute } from '@tanstack/react-router'
import { AuthView } from '@/components/auth'

export const Route = createFileRoute('/auth/$pathname')({
  component: AuthPage,
})

function AuthPage() {
  const { pathname } = Route.useParams()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <AuthView pathname={pathname} redirectTo="/" />
    </div>
  )
}
