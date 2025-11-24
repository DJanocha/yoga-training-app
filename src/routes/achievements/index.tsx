import { createFileRoute } from '@tanstack/react-router'
import { useTRPC } from '@/lib/trpc'
import { useQuery } from '@tanstack/react-query'
import { RedirectToSignIn, SignedIn, AuthLoading } from '@/components/auth'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Flame, TrendingUp, Calendar, Award } from 'lucide-react'
import { format } from 'date-fns'

export const Route = createFileRoute('/achievements/')({
  component: Achievements,
})

function Achievements() {
  return (
    <>
      <AuthLoading>
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthLoading>
      <RedirectToSignIn />
      <SignedIn>
        <AchievementsContent />
      </SignedIn>
    </>
  )
}

function AchievementsContent() {
  const trpc = useTRPC()

  const { data: achievements, isLoading: achievementsLoading } = useQuery(
    trpc.achievements.list.queryOptions()
  )

  const { data: stats, isLoading: statsLoading } = useQuery(
    trpc.achievements.getStats.queryOptions()
  )

  if (achievementsLoading || statsLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Get icon for achievement category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'personal-record':
        return <TrendingUp className="h-5 w-5 text-green-500" />
      case 'streak':
        return <Flame className="h-5 w-5 text-orange-500" />
      case 'milestone':
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 'consistency':
        return <Calendar className="h-5 w-5 text-blue-500" />
      default:
        return <Award className="h-5 w-5 text-purple-500" />
    }
  }

  // Get badge name from badgeId
  const getBadgeName = (badgeId: string) => {
    if (badgeId.startsWith('pr_')) {
      return badgeId.replace('pr_', '').replace(/_/g, ' ')
    }
    return badgeId.replace(/_/g, ' ')
  }

  if (!achievements || achievements.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Achievements</h1>
            <p className="text-sm text-muted-foreground hidden md:block">Your accomplishments</p>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No achievements yet</h2>
            <p className="text-muted-foreground">
              Complete workouts and set personal records to unlock achievements
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Achievements</h1>
          <p className="text-sm text-muted-foreground hidden md:block">Your accomplishments</p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.milestone || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Streaks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.streak || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                PRs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.personalRecord || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Consistency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.consistency || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements List */}
        <div className="space-y-3">
          {achievements.map((achievement: any) => (
            <Card key={achievement.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getCategoryIcon(achievement.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold capitalize">
                          {getBadgeName(achievement.badgeId)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(achievement.unlockedAt), 'PPP')}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {achievement.category.replace('-', ' ')}
                      </Badge>
                    </div>
                    {achievement.metadata && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {achievement.metadata.exerciseName && (
                          <p>Exercise: {achievement.metadata.exerciseName}</p>
                        )}
                        {achievement.metadata.value && (
                          <p>Value: {achievement.metadata.value}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
