import { createFileRoute } from '@tanstack/react-router'
import { ExerciseList } from '@/components/ExerciseList'

export const Route = createFileRoute('/exercises/')({
  component: Exercises,
})

function Exercises() {
  return <ExerciseList />
}
