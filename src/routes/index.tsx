import { Link, createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, Trophy, Clock, Star } from 'lucide-react'
import { useTRPC } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
import { RedirectToSignIn, SignedIn, AuthLoading, } from '@/components/auth'
import { authClient } from '@/lib/auth-client'
import { HomePageSkeleton } from '@/components/skeletons'
import { Skeleton } from '@/components/ui/skeleton'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'

// Lazy load recharts (it's a heavy library)
const WeeklyActivityChart = lazy(() =>
  import('@/components/charts/weekly-activity-chart').then(m => ({ default: m.WeeklyActivityChart }))
)

export const Route = createFileRoute('/')({
  component: Home,
})

const sum = (arr: number[]) => {
  return arr.reduce((acc, curr) => acc + curr, 0)
}

function Home() {
  const { data: session, isPending } = authClient.useSession()

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('[HOME] Session state:', { session, isPending })
  }

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
  const { data: achievements } = useQuery(trpc.achievements.list.queryOptions())

  const currentStreak = settings?.currentStreak || 0
  const weeklyGoal = settings?.weeklyGoal || 3

  if (settingsLoading || statsLoading || weekLoading) {
    return <HomePageSkeleton />
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

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />

        {/* Stats Grid - Compact */}
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-lg font-bold leading-tight">{currentStreak}</div>
                <p className="text-xs text-muted-foreground truncate">
                  day streak
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-lg font-bold leading-tight">
                  {stats?.totalWorkouts || 0}
                </div>
                <p className="text-xs text-muted-foreground truncate">workouts</p>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-lg font-bold leading-tight">
                  {stats?.totalMinutes || 0}
                </div>
                <p className="text-xs text-muted-foreground truncate">minutes</p>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-purple-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-lg font-bold leading-tight">
                  {stats?.avgRating ? stats.avgRating.toFixed(1) : '-'}
                </div>
                <p className="text-xs text-muted-foreground truncate">avg rating</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Weekly Activity Chart */}
        {weekData && weekData.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                7-Day Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                <WeeklyActivityChart data={weekData} />
              </Suspense>
            </CardContent>
          </Card>
        )}

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
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
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

        {/* Recent Achievements */}
        {achievements && achievements.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Recent Achievements
                </CardTitle>
                <Link to="/achievements" className="text-sm text-primary hover:underline">
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {achievements.slice(0, 3).map((achievement: any) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg"
                  >
                    <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate capitalize">
                        {achievement.badgeId.replace('pr_', '').replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <Link to="/sequences">
            <Button className="w-full">Start Workout</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
