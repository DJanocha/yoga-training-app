import { useState, useEffect, useRef, useMemo } from 'react'
import { Star, Trophy, Package2, Plus, Search } from 'lucide-react'
import { useHaptic } from '@/hooks/useHaptic'
import { useTRPC } from '@/lib/trpc'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ExerciseModifierAssignment, ActiveModifier, ExerciseGroup, SequenceExercise } from '@/db/types'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Badge display names
const BADGE_NAMES: Record<string, string> = {
  first_workout: '🎉 First Workout',
  workout_5: '💪 5 Workouts',
  workout_10: '🔥 10 Workouts',
  workout_25: '⭐ 25 Workouts',
  workout_50: '🏆 50 Workouts',
  workout_100: '👑 100 Workouts',
  streak_3: '📅 3 Day Streak',
  streak_7: '🔥 7 Day Streak',
  streak_14: '⚡ 14 Day Streak',
  streak_30: '💫 30 Day Streak',
  streak_100: '🌟 100 Day Streak',
  consistent_12: '📊 12 Workouts/Month',
  consistent_20: '🎯 20 Workouts/Month',
}

interface ExecuteSequenceProps {
  sequenceId: number;
  onExit: () => void;
}

export function ExecuteSequence({ sequenceId, onExit }: ExecuteSequenceProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  
  const { data: sequence, isLoading: sequenceLoading } = useQuery(trpc.sequences.byId.queryOptions({ id: sequenceId }))
  const { data: exercises, isLoading: exercisesLoading } = useQuery(trpc.exercises.list.queryOptions())
  const { data: settings, isLoading: settingsLoading } = useQuery(trpc.settings.get.queryOptions())
  const { data: allModifiers } = useQuery(trpc.modifiers.list.queryOptions())

  const startExecution = useMutation(trpc.executions.start.mutationOptions())
  const updateExecution = useMutation(trpc.executions.updateExecution.mutationOptions({

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.executions.getHistory.queryKey() })
      queryClient.invalidateQueries({ queryKey: trpc.executions.getUserStats.queryKey() })
    },
  }))
  const submitRatingMutation = useMutation(trpc.executions.submitRating.mutationOptions())
  const calculateStreak = useMutation(trpc.settings.calculateStreak.mutationOptions())
  const checkBadges = useMutation(trpc.settings.checkBadges.mutationOptions())
  const updateSequence = useMutation(trpc.sequences.update.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.sequences.byId.queryKey({ id: sequenceId }) })
      toast.success('Exercise saved to sequence')
    },
  }))
  const haptic = useHaptic();


  const [executionId, setExecutionId] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [totalPauseDuration, setTotalPauseDuration] = useState(0);
  const [exerciseStartTime, setExerciseStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Array<{
    exerciseId: number | "break";
    startedAt: number;
    completedAt?: number;
    value?: number;
    skipped?: boolean;
    activeModifiers?: ActiveModifier[];
  }>>([]);
  // Track which modifiers are currently active for the current exercise
  const [currentActiveModifiers, setCurrentActiveModifiers] = useState<Set<number>>(new Set());
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [personalRecords, setPersonalRecords] = useState<Array<{
    exerciseId: number;
    type: string;
    previousBest?: number;
    newBest: number;
  }>>([]);
  const [showPRCelebration, setShowPRCelebration] = useState(false);

  // Add Exercise during workout state
  const [workoutExercises, setWorkoutExercises] = useState<Array<{
    id?: string;
    exerciseId: number | "break";
    config: { measure: "time" | "repetitions"; targetValue?: number };
    modifiers?: ExerciseModifierAssignment[];
  }> | null>(null); // null = use sequence.exercises, array = modified copy
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState("");
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [pendingExerciseToAdd, setPendingExerciseToAdd] = useState<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const lastBeepTimeRef = useRef<number>(0);

  useEffect(() => {
    const init = async () => {
      startExecution.mutate({ sequenceId }, {
        onSuccess: (execution) => {
          setExecutionId(execution.id);
          setExerciseStartTime(Date.now());
        },
      });
    };
    init();
  }, [sequenceId]);

  useEffect(() => {
    if (!isPaused && !showInput && !showSummary) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - exerciseStartTime - totalPauseDuration);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPaused, exerciseStartTime, totalPauseDuration, showInput, showSummary]);

  useEffect(() => {
    if (!sequence || !settings || isPaused || showInput || showSummary) return;

    const exercises = sequence.exercises as Array<{ exerciseId: number | "break"; config: any }>;
    const currentExercise = exercises[currentIndex];
    if (!currentExercise) return;

    const { config } = currentExercise;
    // Auto-advance only in strict mode (default to elastic if not set)
    const goal = (sequence as any).goal || "elastic";
    if (goal === "strict" && config.measure === "time" && config.targetValue) {
      const remaining = config.targetValue - Math.floor(elapsedTime / 1000);

      if (settings.beepEnabled && remaining <= settings.beepStartSeconds && remaining > 0) {
        const now = Date.now();
        if (now - lastBeepTimeRef.current >= 1000) {
          playBeep();
          lastBeepTimeRef.current = now;
        }
      }

      if (remaining <= 0) {
        handleComplete(config.targetValue);
      }
    }
  }, [elapsedTime, sequence, settings, currentIndex, isPaused, showInput, showSummary]);

  const playBeep = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  };

  const handlePause = () => {
    setIsPaused(true);
    setPausedAt(Date.now());
  };

  const handleResume = () => {
    if (pausedAt) {
      setTotalPauseDuration(totalPauseDuration + (Date.now() - pausedAt));
    }
    setIsPaused(false);
    setPausedAt(null);
  };

  const handleComplete = (value?: number) => {
    if (!sequence || !executionId) return;

    const exercises = sequence.exercises as Array<{ exerciseId: number | "break"; config: any; modifiers?: ExerciseModifierAssignment[] }>;
    const currentExercise = exercises[currentIndex];

    // Convert active modifier IDs to ActiveModifier objects
    const activeModifiers: ActiveModifier[] = Array.from(currentActiveModifiers).map(modifierId => {
      const modifier = allModifiers?.find(m => m.id === modifierId);
      return {
        modifierId,
        value: modifier ? [modifier.name, modifier.value, modifier.unit !== 'none' ? modifier.unit : null].filter(Boolean).join(' ') : undefined,
      };
    });

    const completed = {
      exerciseId: currentExercise.exerciseId,
      startedAt: exerciseStartTime,
      completedAt: Date.now(),
      value,
      activeModifiers: activeModifiers.length > 0 ? activeModifiers : undefined,
    };

    const newCompleted = [...completedExercises, completed];
    setCompletedExercises(newCompleted);

    if (currentIndex < exercises.length - 1) {
      // Transitioning to next exercise
      haptic.medium();
      setCurrentIndex(currentIndex + 1);
      setExerciseStartTime(Date.now());
      setElapsedTime(0);
      setTotalPauseDuration(0);
      // Reset active modifiers for next exercise (they can toggle again)
      setCurrentActiveModifiers(new Set());
    } else {
      // Completing entire sequence
      haptic.success();
      finishSequence(newCompleted);
    }
  };

  const handleSkip = () => {
    if (!sequence || !executionId) return;

    const exercises = sequence.exercises as Array<{ exerciseId: number | "break"; config: any }>;
    const currentExercise = exercises[currentIndex];
    const skipped = {
      exerciseId: currentExercise.exerciseId,
      startedAt: exerciseStartTime,
      completedAt: Date.now(),
      skipped: true,
    };

    const newCompleted = [...completedExercises, skipped];
    setCompletedExercises(newCompleted);

    if (currentIndex < exercises.length - 1) {
      // Skipping to next exercise
      haptic.light();
      setCurrentIndex(currentIndex + 1);
      setExerciseStartTime(Date.now());
      setElapsedTime(0);
      setTotalPauseDuration(0);
      // Reset active modifiers for next exercise
      setCurrentActiveModifiers(new Set());
    } else {
      // Completing entire sequence (even with skip)
      haptic.success();
      finishSequence(newCompleted);
    }
  };

  const handleGoBack = () => {
    if (currentIndex > 0) {
      setCompletedExercises(completedExercises.slice(0, -1));
      setCurrentIndex(currentIndex - 1);
      setExerciseStartTime(Date.now());
      setElapsedTime(0);
      // Reset active modifiers when going back
      setCurrentActiveModifiers(new Set());
      setTotalPauseDuration(0);
    }
  };

  const finishSequence = async (exercises: typeof completedExercises) => {
    if (!executionId) return;

    updateExecution.mutate({
      id: executionId,
      exercises: exercises as any,
      totalPauseDuration,
      completedAt: new Date(),
    }, {
      onSuccess: () => {
        // Show rating dialog
        setShowRatingDialog(true);
      },
    });
  };

  const handleRatingSubmit = async () => {
    if (!executionId || rating === 0) return;

    try {
      // Submit rating and get PRs
      submitRatingMutation.mutate({
        id: executionId,
        rating,
        feedback: feedback || undefined,
      }, {
        onSuccess: (result) => {
          // Calculate streak and show milestone notifications
          calculateStreak.mutate(undefined as any, {
            onSuccess: (streakResult) => {
              // Celebrate streak milestones
              const streakMilestones = [3, 7, 14, 30, 100];
              if (streakResult.currentStreak && streakMilestones.includes(streakResult.currentStreak)) {
                toast.success(`${streakResult.currentStreak} Day Streak!`, {
                  description: 'Keep up the amazing work! 🔥',
                  duration: 5000,
                });
              }
            },
          });

          // Check for new badges and show notifications
          checkBadges.mutate(undefined as any, {
            onSuccess: (newBadges) => {
              if (newBadges && newBadges.length > 0) {
                for (const badgeId of newBadges) {
                  const badgeName = BADGE_NAMES[badgeId] || badgeId;
                  toast.success('Achievement Unlocked!', {
                    description: badgeName,
                    duration: 5000,
                  });
                }
              }
            },
          });

          // Show PR celebration if any PRs were achieved
          if (result.personalRecords && result.personalRecords.length > 0) {
            setPersonalRecords(result.personalRecords);
            setShowRatingDialog(false);
            setShowPRCelebration(true);
          } else {
            setShowRatingDialog(false);
            setShowSummary(true);
          }
        },
        onError: (error) => {
          console.error('Failed to submit rating:', error);
          setShowRatingDialog(false);
          setShowSummary(true);
        },
      });
    } catch (error) {
      console.error('Failed to submit rating:', error);
      setShowRatingDialog(false);
      setShowSummary(true);
    }
  };

  const handleInputSubmit = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value) && value >= 0) {
      handleComplete(value);
      setShowInput(false);
      setInputValue("");
    }
  };

  if (sequenceLoading || exercisesLoading || settingsLoading || !sequence || !exercises || !settings || !executionId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Sequence Complete! 🎉
          </h2>
          <p className="text-lg text-gray-600 text-center mb-6">
            Great work on completing {sequence.name}!
          </p>
          <button
            onClick={onExit}
            aria-label="Exit workout summary and return to sequences"
            className="w-full min-h-[44px] px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Use workoutExercises if modified during workout, otherwise use original sequence
  const sequenceExercises = (workoutExercises ?? sequence.exercises) as Array<{ id?: string; exerciseId: number | "break"; config: any; modifiers?: ExerciseModifierAssignment[] }>;
  const sequenceGroups = (sequence.groups as ExerciseGroup[]) || [];
  const sequenceAvailableModifiers = (sequence.availableModifiers as number[]) || [];
  const currentExercise = sequenceExercises[currentIndex];

  // Filter exercises for picker based on search query
  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    if (!exerciseSearchQuery.trim()) return exercises;
    const query = exerciseSearchQuery.toLowerCase();
    return exercises.filter(e =>
      e.name.toLowerCase().includes(query) ||
      e.description?.toLowerCase().includes(query)
    );
  }, [exercises, exerciseSearchQuery]);

  // Handle adding exercise to workout
  const handleAddExercise = (exerciseId: number) => {
    setPendingExerciseToAdd(exerciseId);
    setShowExercisePicker(false);
    setShowSavePrompt(true);
  };

  // Insert exercise after current position
  const insertExerciseAfterCurrent = (exerciseId: number, saveToSequence: boolean) => {
    const currentExercises = workoutExercises ?? [...(sequence.exercises as Array<{
      id?: string;
      exerciseId: number | "break";
      config: { measure: "time" | "repetitions"; targetValue?: number };
      modifiers?: ExerciseModifierAssignment[];
    }>)];

    const newExercise = {
      id: `${exerciseId}-${Date.now()}`,
      exerciseId,
      config: {
        measure: "time" as const,
        targetValue: 30, // Default 30 seconds
      },
    };

    // Insert after current index
    const insertIndex = currentIndex + 1;
    const updatedExercises = [
      ...currentExercises.slice(0, insertIndex),
      newExercise,
      ...currentExercises.slice(insertIndex),
    ];

    setWorkoutExercises(updatedExercises);

    // If user wants to save to sequence permanently
    if (saveToSequence) {
      updateSequence.mutate({
        id: sequenceId,
        exercises: updatedExercises as SequenceExercise[],
      });
    }

    haptic.medium();
    toast.success('Exercise added to workout');
  };

  // Track current group progress during execution
  const currentGroupInfo = useMemo(() => {
    if (!currentExercise?.id) return null;

    const group = sequenceGroups.find((g) => g.exerciseIds.includes(currentExercise.id!));
    if (!group) return null;

    const positionInGroup = group.exerciseIds.indexOf(currentExercise.id!) + 1;

    return {
      name: group.name,
      current: positionInGroup,
      total: group.exerciseIds.length,
    };
  }, [currentExercise, sequenceGroups]);
  const currentExerciseData =
    currentExercise.exerciseId === "break"
      ? { name: "Break", photoUrls: [], links: [] }
      : exercises.find((e) => e.id === currentExercise.exerciseId);

  // Get modifiers that are both available for the sequence AND assigned to this specific exercise
  const exerciseModifiers = useMemo(() => {
    if (currentExercise.exerciseId === "break" || !currentExercise.modifiers) return [];
    // Only show modifiers that were assigned to this exercise in the sequence builder
    return currentExercise.modifiers
      .filter(m => sequenceAvailableModifiers.includes(m.modifierId))
      .map(assignment => {
        const modifier = allModifiers?.find(m => m.id === assignment.modifierId);
        return modifier ? { ...modifier, effect: assignment.effect } : null;
      })
      .filter(Boolean) as Array<NonNullable<typeof allModifiers>[number] & { effect: 'easier' | 'harder' | 'neutral' }>;
  }, [currentExercise, sequenceAvailableModifiers, allModifiers]);

  // Toggle modifier for current exercise
  const toggleModifier = (modifierId: number) => {
    setCurrentActiveModifiers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(modifierId)) {
        newSet.delete(modifierId);
      } else {
        newSet.add(modifierId);
      }
      return newSet;
    });
    haptic.light();
  };

  const { data: lastAttemptData } = useQuery(trpc.executions.getLastAttempt.queryOptions({ exerciseId: currentExercise.exerciseId },{enabled: currentExercise.exerciseId !== "break"}))

  const { config } = currentExercise;
  // Goal is now at sequence level (Phase 10.1)
  const sequenceGoal = (sequence.goal as 'strict' | 'elastic') || 'elastic';
  const isStrictTime = sequenceGoal === "strict" && config.measure === "time";
  const isStrictReps = sequenceGoal === "strict" && config.measure === "repetitions";
  const isElastic = sequenceGoal === "elastic";

  const timeRemaining = isStrictTime && config.targetValue
    ? Math.max(0, config.targetValue - Math.floor(elapsedTime / 1000))
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b shadow-sm p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">{sequence.name}</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowExercisePicker(true)}
              aria-label="Add exercise to workout"
              className="min-h-[44px] min-w-[44px]"
            >
              <Plus className="h-5 w-5" />
            </Button>
            <button
              onClick={() => {
                if (confirm("Exit sequence?")) onExit();
              }}
              aria-label="Exit workout sequence"
              className="min-h-[44px] min-w-[44px] text-red-600 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>
        <p className="text-base text-gray-600 mt-1">
          Exercise {currentIndex + 1} of {sequenceExercises.length}
          {currentGroupInfo && (
            <span className="ml-2 text-primary font-medium">
              ({currentGroupInfo.name}: {currentGroupInfo.current}/{currentGroupInfo.total})
            </span>
          )}
        </p>
      </header>

      <main className="flex-1 p-4 flex flex-col">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {currentExerciseData?.name || "Unknown"}
          </h2>

          {currentExerciseData?.photoUrls && currentExerciseData.photoUrls.length > 0 && (
            <img
              src={currentExerciseData.photoUrls[0]}
              alt={currentExerciseData.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}

          {currentExerciseData?.links && currentExerciseData.links.length > 0 && (
            <div className="mb-4 space-y-2">
              {currentExerciseData.links.map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-base text-blue-600 hover:underline"
                >
                  {link}
                </a>
              ))}
            </div>
          )}

          {lastAttemptData && (
            <p className="text-base text-gray-600 mb-4">
              Last: {lastAttemptData.value}{" "}
              {config.measure === "time" ? "seconds" : "reps"}
            </p>
          )}

          {/* Toggleable Modifier Badges */}
          {exerciseModifiers.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Package2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Equipment</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {exerciseModifiers.map((modifier) => {
                  const isActive = currentActiveModifiers.has(modifier.id);
                  const displayText = [
                    modifier.name,
                    modifier.value !== null && modifier.value !== undefined ? modifier.value : null,
                    modifier.unit && modifier.unit !== 'none' ? modifier.unit : null,
                  ].filter(Boolean).join(' ');

                  // Color based on effect
                  const effectColors = modifier.effect === 'easier'
                    ? isActive
                      ? 'bg-green-600 text-white border-green-600 ring-2 ring-offset-1 ring-green-600'
                      : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                    : modifier.effect === 'harder'
                    ? isActive
                      ? 'bg-red-600 text-white border-red-600 ring-2 ring-offset-1 ring-red-600'
                      : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'
                    : isActive
                      ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-offset-1 ring-blue-600'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200';

                  return (
                    <button
                      key={modifier.id}
                      type="button"
                      onClick={() => toggleModifier(modifier.id)}
                      aria-label={`Toggle ${displayText} modifier (${modifier.effect})`}
                      aria-pressed={isActive}
                      className={`
                        px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                        min-h-[36px] touch-manipulation
                        ${effectColors}
                      `}
                    >
                      {displayText}
                      {modifier.effect !== 'neutral' && (
                        <span className="ml-1 text-xs opacity-75">
                          ({modifier.effect === 'easier' ? '↓' : '↑'})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {currentActiveModifiers.size > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {currentActiveModifiers.size} modifier{currentActiveModifiers.size > 1 ? 's' : ''} active
                </p>
              )}
            </div>
          )}

          <div className="text-center py-8">
            {isStrictTime && (
              <div className="text-6xl font-bold text-gray-900">
                {formatTime(timeRemaining)}
              </div>
            )}
            {isStrictReps && (
              <div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  Target: {config.targetValue} reps
                </div>
                <button
                  onClick={() => setShowInput(true)}
                  aria-label="Mark exercise as complete and record reps"
                  className="min-h-[44px] px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700"
                >
                  Done
                </button>
              </div>
            )}
            {isElastic && (
              <button
                onClick={() => setShowInput(true)}
                aria-label="Mark exercise as complete and record attempt"
                className="min-h-[44px] px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700"
              >
                Complete Exercise
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          {isPaused ? (
            <button
              onClick={handleResume}
              aria-label="Resume workout timer"
              className="col-span-2 min-h-[44px] px-6 py-3 bg-green-600 text-white text-base font-semibold rounded-lg hover:bg-green-700"
            >
              Resume
            </button>
          ) : (
            <button
              onClick={handlePause}
              aria-label="Pause workout timer"
              className="col-span-2 min-h-[44px] px-6 py-3 bg-yellow-600 text-white text-base font-semibold rounded-lg hover:bg-yellow-700"
            >
              Pause
            </button>
          )}
          <button
            onClick={handleGoBack}
            disabled={currentIndex === 0}
            aria-label="Go back to previous exercise"
            className="min-h-[44px] px-6 py-3 bg-gray-200 text-gray-700 text-base font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            ← Back
          </button>
          <button
            onClick={handleSkip}
            aria-label="Skip to next exercise"
            className="min-h-[44px] px-6 py-3 bg-gray-200 text-gray-700 text-base font-semibold rounded-lg hover:bg-gray-300"
          >
            Skip →
          </button>
        </div>
      </main>

      {showInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Enter {config.measure === "time" ? "seconds" : "reps"}
            </h3>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={lastAttemptData?.value?.toString() || "0"}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowInput(false);
                  setInputValue("");
                }}
                className="flex-1 min-h-[44px] px-4 py-2 bg-gray-200 text-gray-700 text-base font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleInputSubmit}
                className="flex-1 min-h-[44px] px-4 py-2 bg-blue-600 text-white text-base font-semibold rounded-lg"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {showRatingDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              How was your workout?
            </h3>
            <p className="text-sm text-gray-600 mb-6 text-center">
              Rate your experience
            </p>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  aria-label={`Rate workout ${star} out of 5 stars`}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Feedback */}
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Any notes? (optional)"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg mb-4 resize-none"
              rows={3}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRatingDialog(false);
                  setShowSummary(true);
                }}
                className="flex-1 min-h-[44px] px-4 py-2 bg-gray-200 text-gray-700 text-base font-semibold rounded-lg"
              >
                Skip
              </button>
              <button
                onClick={handleRatingSubmit}
                disabled={rating === 0}
                className="flex-1 min-h-[44px] px-4 py-2 bg-blue-600 text-white text-base font-semibold rounded-lg disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {showPRCelebration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <Trophy className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                New Personal {personalRecords.length === 1 ? "Record" : "Records"}!
              </h3>
              <p className="text-sm text-gray-600">
                You crushed it today!
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {personalRecords.map((pr, index) => {
                const exercise = exercises?.find((e) => e.id === pr.exerciseId);
                return (
                  <div
                    key={index}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                  >
                    <p className="font-semibold text-gray-900">
                      {exercise?.name || "Exercise"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {pr.previousBest
                        ? `${pr.previousBest} → ${pr.newBest}`
                        : `New best: ${pr.newBest}`}{" "}
                      {pr.type === "time" ? "seconds" : "reps"}
                    </p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setShowPRCelebration(false);
                setShowSummary(true);
              }}
              className="w-full min-h-[44px] px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Exercise Picker Sheet */}
      <Sheet open={showExercisePicker} onOpenChange={setShowExercisePicker}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Add Exercise</SheetTitle>
            <SheetDescription>
              Select an exercise to add after the current one
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={exerciseSearchQuery}
                onChange={(e) => setExerciseSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="mt-4 overflow-y-auto max-h-[calc(80vh-180px)]">
            {filteredExercises.length > 0 ? (
              <div className="grid gap-2">
                {filteredExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => handleAddExercise(exercise.id)}
                    className="flex items-center gap-3 p-3 text-left hover:bg-muted rounded-lg transition-colors"
                  >
                    {exercise.photoUrls && exercise.photoUrls.length > 0 && (
                      <img
                        src={exercise.photoUrls[0]}
                        alt={exercise.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{exercise.name}</p>
                      {exercise.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {exercise.description}
                        </p>
                      )}
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {exerciseSearchQuery ? "No exercises match your search" : "No exercises available"}
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Save to Sequence Prompt */}
      <AlertDialog open={showSavePrompt} onOpenChange={setShowSavePrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save to sequence?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to save this exercise to the sequence permanently, or just add it for this workout?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={() => {
                if (pendingExerciseToAdd !== null) {
                  insertExerciseAfterCurrent(pendingExerciseToAdd, false);
                  setPendingExerciseToAdd(null);
                }
              }}
            >
              This workout only
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingExerciseToAdd !== null) {
                  insertExerciseAfterCurrent(pendingExerciseToAdd, true);
                  setPendingExerciseToAdd(null);
                }
              }}
            >
              Save permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
