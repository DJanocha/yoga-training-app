import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTRPC } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
import { RedirectToSignIn, SignedIn, AuthLoading } from '@/components/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth } from 'date-fns'

export const Route = createFileRoute('/history/calendar/')({
  component: CalendarView,
})

function CalendarView() {
  return (
    <>
      <AuthLoading>
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthLoading>
      <RedirectToSignIn />
      <SignedIn>
        <CalendarViewContent />
      </SignedIn>
    </>
  )
}

function CalendarViewContent() {
  const trpc = useTRPC()
  const navigate = useNavigate()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  // Fetch history for the current month
  const { data: history, isLoading } = useQuery(
    trpc.executions.getHistory.queryOptions({
      startDate: monthStart,
      endDate: monthEnd,
    })
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Group workouts by date
  const workoutsByDate = new Map<string, number>()
  history?.forEach((item: any) => {
    const dateStr = format(new Date(item.startedAt), 'yyyy-MM-dd')
    workoutsByDate.set(dateStr, (workoutsByDate.get(dateStr) || 0) + 1)
  })

  // Get all days in the month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get the starting day of week (0 = Sunday)
  const startingDayOfWeek = monthStart.getDay()

  // Previous/next month handlers
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
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
          <h1 className="text-2xl font-bold md:text-3xl">Calendar View</h1>
          <p className="text-sm text-muted-foreground hidden md:block">Your workout calendar</p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}

              {/* Empty cells for days before month starts */}
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Calendar days */}
              {daysInMonth.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const workoutCount = workoutsByDate.get(dateStr) || 0
                const hasWorkout = workoutCount > 0
                const today = isToday(day)

                return (
                  <div
                    key={dateStr}
                    className={`
                      aspect-square p-2 rounded-lg border transition-colors
                      ${today ? 'border-primary border-2' : 'border-border'}
                      ${hasWorkout ? 'bg-primary/10' : 'bg-background'}
                      ${!isSameMonth(day, currentMonth) ? 'opacity-50' : ''}
                    `}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className={`text-sm font-medium ${today ? 'text-primary' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      {hasWorkout && (
                        <div className="mt-1 flex gap-1">
                          {Array.from({ length: Math.min(workoutCount, 3) }).map((_, i) => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-primary"
                            />
                          ))}
                          {workoutCount > 3 && (
                            <div className="text-[10px] text-primary font-bold">
                              +{workoutCount - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-primary" />
                <span>Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary/10 border border-border flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <span>Workout day</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
