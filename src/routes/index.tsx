import { Link, createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, Trophy, Clock, Star } from 'lucide-react'
import { useTRPC } from '@/lib/trpc'
// import { sum } from 'lodash'
import { useQuery } from '@tanstack/react-query'
import { RedirectToSignIn, SignedIn, AuthLoading, } from '@/components/auth'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/')({
  component: Home,
})

const sum = (arr: number[]) => {
  return arr.reduce((acc, curr) => acc + curr, 0)
}

function Home() {
  return (
    <>
      <AuthLoading>
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AuthLoading>
      <RedirectToSignIn />
      <SignedIn>
        <HomeContent />
      </SignedIn>
    </>
  )
}

function HomeContent() {
  const trpc = useTRPC()
  const {data: session} = authClient.useSession()
  const { data: settings, isLoading: settingsLoading } = useQuery(trpc.settings.get.queryOptions())
  const { data: stats, isLoading: statsLoading } = useQuery(trpc.executions.getDetailedStats.queryOptions())
  const { data: weekData, isLoading: weekLoading } = useQuery(trpc.executions.getWeeklyProgress.queryOptions())

  const currentStreak = settings?.currentStreak || 0
  const weeklyGoal = settings?.weeklyGoal || 3

  if (settingsLoading || statsLoading || weekLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  if(!session?.user){
    return <RedirectToSignIn/>
  }

  // Calculate weekly progress
  const workoutsThisWeek = sum(weekData?.map(day => day.workouts) || [])
  const weeklyProgressPercent = Math.min((workoutsThisWeek / weeklyGoal) * 100, 100)

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl pb-24">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">YogaFlow</h1>
          <p className="text-muted-foreground">
            {settings?.userName
              ? `Welcome back, ${session.user.name}!`
              : 'Build your yoga practice'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentStreak}</div>
              <p className="text-xs text-muted-foreground">
                {currentStreak === 1 ? 'day' : 'days'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Total Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalWorkouts || 0}
              </div>
              <p className="text-xs text-muted-foreground">completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Total Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalMinutes || 0}
              </div>
              <p className="text-xs text-muted-foreground">minutes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4 text-purple-500" />
                Avg Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.avgRating ? stats.avgRating.toFixed(1) : '-'}
              </div>
              <p className="text-xs text-muted-foreground">out of 5</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Goal Progress */}
        {weeklyGoal > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Weekly Goal Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {workoutsThisWeek} / {weeklyGoal} workouts
                </span>
                <span className="font-medium">{Math.round(weeklyProgressPercent)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${weeklyProgressPercent}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personal Records */}
        {stats && stats.personalRecords > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Personal Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You've set {stats.personalRecords} personal{' '}
                {stats.personalRecords === 1 ? 'record' : 'records'}!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <Link to="/sequences">
            <Button className="w-full">Start Workout</Button>
          </Link>
          <Link to="/sequences">
            <Button variant="outline" className="w-full bg-transparent">
              Browse Sequences
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
