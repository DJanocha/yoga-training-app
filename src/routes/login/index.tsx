import { createFileRoute } from '@tanstack/react-router'
import { AuthView } from '@/components/auth'

export const Route = createFileRoute('/login/')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <AuthView />
    </div>
  )
}
