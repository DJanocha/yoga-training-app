import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTRPC } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
import { RedirectToSignIn, SignedIn, AuthLoading } from '@/components/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, TrendingUp, Calendar, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

export const Route = createFileRoute('/history/records/')({
  component: PersonalRecords,
})

function PersonalRecords() {
  return (
    <>
      <AuthLoading>
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthLoading>
      <RedirectToSignIn />
      <SignedIn>
        <PersonalRecordsContent />
      </SignedIn>
    </>
  )
}

function PersonalRecordsContent() {
  const trpc = useTRPC()
  const navigate = useNavigate()

  const { data: records, isLoading } = useQuery(
    trpc.executions.getPersonalRecords.queryOptions()
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!records || records.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center gap-4 p-4 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/history' })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold md:text-3xl">Personal Records</h1>
            <p className="text-sm text-muted-foreground hidden md:block">Your best performances</p>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No personal records yet</h2>
            <p className="text-muted-foreground">
              Complete workouts to set your first records
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: '/history' })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold md:text-3xl">Personal Records</h1>
          <p className="text-sm text-muted-foreground hidden md:block">Your best performances</p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {records.map((record) => (
          <Card key={record.exerciseId}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <div>
                    <CardTitle className="text-lg">{record.exerciseName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {record.history.length} record{record.history.length !== 1 ? 's' : ''} set
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {record.currentBest}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {record.measure === 'time' ? 'seconds' : 'reps'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {record.history.map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-semibold">
                          {entry.value} {record.measure === 'time' ? 's' : ' reps'}
                        </span>
                        {entry.previousBest && (
                          <Badge variant="outline" className="text-xs">
                            +{entry.value - entry.previousBest}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.sequenceName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(entry.achievedAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  )
}
