import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTRPC } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
import { RedirectToSignIn, SignedIn, AuthLoading } from '@/components/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, CheckCircle, Star, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

export const Route = createFileRoute('/history/')({
  component: History,
})

function History() {
  return (
    <>
      <AuthLoading>
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthLoading>
      <RedirectToSignIn />
      <SignedIn>
        <HistoryContent />
      </SignedIn>
    </>
  )
}

function HistoryContent() {
  const trpc = useTRPC()
  const navigate = useNavigate()

  const { data: history, isLoading } = useQuery(
    trpc.executions.getHistory.queryOptions({})
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between p-4 border-b border-border md:hidden">
          <h1 className="text-2xl font-bold">Workout History</h1>
        </header>

        <div className="hidden md:block mb-6 p-4">
          <h1 className="text-3xl font-bold">Workout History</h1>
          <p className="text-muted-foreground">Track your progress over time</p>
        </div>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No workouts yet</h2>
            <p className="text-muted-foreground">
              Complete your first workout to see it here
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border md:hidden">
        <h1 className="text-2xl font-bold">Workout History</h1>
      </header>

      {/* Desktop Header */}
      <div className="hidden md:block mb-6 p-4">
        <h1 className="text-3xl font-bold">Workout History</h1>
        <p className="text-muted-foreground">Track your progress over time</p>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.map((item: any) => {
          const startedAt = new Date(item.startedAt)
          const completedAt = item.completedAt ? new Date(item.completedAt) : null
          const duration = completedAt
            ? Math.round((completedAt.getTime() - startedAt.getTime()) / 1000 / 60)
            : 0

          return (
            <Card
              key={item.executionId}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() =>
                navigate({ to: '/history/$id', params: { id: String(item.executionId) } })
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.sequenceName}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3" />
                      {format(startedAt, 'PPP')} at {format(startedAt, 'p')}
                    </CardDescription>
                  </div>
                  {item.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{item.rating}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{duration}m</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span>{item.completedCount} exercises</span>
                  </div>
                  {item.personalRecords && item.personalRecords > 0 && (
                    <Badge variant="default" className="gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {item.personalRecords} PR
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </main>
    </div>
  )
}
