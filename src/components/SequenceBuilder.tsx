import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTRPC } from "@/lib/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Plus,
  Trash2,
  Settings,
  Coffee,
  ArrowLeft,
  Save,
  Eye,
  Clock,
  Repeat,
  Package2,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Copy,
  Check,
  CheckSquare,
  X,
} from "lucide-react";
import type {
  SequenceExercise,
  MeasureType,
  ExerciseModifierAssignment,
} from "@/db/types";
import type { Modifier } from "@/validators/entities";
import { cn } from "@/lib/utils";
import { BatchActionsBar } from "@/components/batch-actions-bar";
import { EmptyState } from "@/components/empty-state";

type SequenceBuilderProps = {
  sequenceId: number;
};

type SequenceItemWithId = SequenceExercise & { id: string };

// Sortable item component
function SortableExerciseItem({
  item,
  exerciseName,
  modifiers,
  onConfigure,
  onDuplicate,
  onRemove,
  selectionMode,
  isSelected,
  onToggleSelection,
}: {
  item: SequenceItemWithId;
  exerciseName: string;
  modifiers?: Modifier[];
  onConfigure: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBreak = item.exerciseId === "break";

  // In selection mode, the entire row is clickable
  const handleRowClick = () => {
    if (selectionMode && onToggleSelection) {
      onToggleSelection();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleRowClick}
      className={cn(
        "flex items-center gap-3 p-3 bg-card border rounded-lg transition-all",
        isDragging && "opacity-50 shadow-lg",
        isSelected && "ring-2 ring-primary bg-primary/5",
        selectionMode && "cursor-pointer hover:bg-muted/50"
      )}
    >
      {/* Drag handle - only show when NOT in selection mode */}
      {!selectionMode && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      )}

      {/* Selection indicator - show check when selected in selection mode */}
      {selectionMode && (
        <div className="p-1">
          {isSelected ? (
            <Check className="h-5 w-5 text-primary" />
          ) : (
            <div className="h-5 w-5 rounded border-2 border-muted-foreground/30" />
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isBreak ? (
            <>
              <Coffee className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Break</span>
            </>
          ) : (
            <span className="font-medium truncate">{exerciseName}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
          {item.config.measure === "time" ? (
            <>
              <Clock className="h-3 w-3" />
              <span>{item.config.targetValue || 0}s</span>
            </>
          ) : (
            <>
              <Repeat className="h-3 w-3" />
              <span>{item.config.targetValue || 0} reps</span>
            </>
          )}
          {/* Show assigned modifiers */}
          {modifiers &&
            modifiers.length > 0 &&
            item.modifiers &&
            item.modifiers.length > 0 && (
              <>
                {item.modifiers.map((assignment) => {
                  const modifier = modifiers.find(
                    (m) => m.id === assignment.modifierId
                  );
                  if (!modifier) return null;
                  const displayText = [
                    modifier.name,
                    modifier.value !== null && modifier.value !== undefined
                      ? modifier.value
                      : null,
                    modifier.unit && modifier.unit !== "none"
                      ? modifier.unit
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <Badge
                      key={assignment.modifierId}
                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {displayText}
                    </Badge>
                  );
                })}
              </>
            )}
        </div>
      </div>

      {/* Action buttons - only show when NOT in selection mode */}
      {!selectionMode && (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onConfigure}
            className="h-8 w-8"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDuplicate}
            className="h-8 w-8"
            title="Duplicate exercise"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function SequenceBuilder({ sequenceId }: SequenceBuilderProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch sequence data
  const { data: sequence, isLoading: sequenceLoading } = useQuery(
    trpc.sequences.byId.queryOptions({ id: sequenceId })
  );

  // Fetch all exercises for picker
  const { data: allExercises } = useQuery(trpc.exercises.list.queryOptions());

  // Fetch all modifiers
  const { data: allModifiers } = useQuery(trpc.modifiers.list.queryOptions());

  // Update mutation
  const updateSequence = useMutation(
    trpc.sequences.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.sequences.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.sequences.byId.queryKey(),
        });
      },
    })
  );

  // Local state for editing
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState<"strict" | "elastic">("elastic");
  const [exercises, setExercises] = useState<SequenceItemWithId[]>([]);
  const [availableModifiers, setAvailableModifiers] = useState<number[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // UI state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [configureItem, setConfigureItem] = useState<SequenceItemWithId | null>(
    null
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isModifiersExpanded, setIsModifiersExpanded] = useState(false);
  const [isModifierPickerOpen, setIsModifierPickerOpen] = useState(false);

  // Selection mode for batch operations
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBatchConfigOpen, setIsBatchConfigOpen] = useState(false);

  // Batch config values
  const [batchMeasure, setBatchMeasure] = useState<MeasureType>("time");
  const [batchTargetValue, setBatchTargetValue] = useState<number | undefined>(
    30
  );
  const [batchModifiers, setBatchModifiers] = useState<
    ExerciseModifierAssignment[]
  >([]);

  // Multiply count for multi-insert
  const [multiplyCount, setMultiplyCount] = useState(1);

  // Initialize form when sequence loads
  if (sequence && !isInitialized) {
    setName(sequence.name);
    setDescription(sequence.description || "");
    setGoal((sequence.goal as "strict" | "elastic") || "elastic");
    // Add unique IDs to exercises for DnD
    const exercisesWithIds = (sequence.exercises as SequenceExercise[]).map(
      (ex, index) => ({
        ...ex,
        id: `${ex.exerciseId}-${index}-${Date.now()}`,
      })
    );
    setExercises(exercisesWithIds);
    // Load available modifiers for this sequence
    setAvailableModifiers((sequence.availableModifiers as number[]) || []);
    setIsInitialized(true);
  }

  // DnD sensors with activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // 150ms delay before touch drag starts
        tolerance: 5, // 5px tolerance for accidental movement
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setExercises((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  // Add exercise
  const addExercise = useCallback((exerciseId: number) => {
    const newItem: SequenceItemWithId = {
      id: `${exerciseId}-${Date.now()}`,
      exerciseId,
      config: {
        measure: "time",
        targetValue: 30,
      },
    };
    setExercises((prev) => [...prev, newItem]);
    setIsPickerOpen(false);
  }, []);

  // Add break at specific index (or at end if not specified)
  const addBreak = useCallback((atIndex?: number) => {
    const newItem: SequenceItemWithId = {
      id: `break-${Date.now()}`,
      exerciseId: "break",
      config: {
        measure: "time",
        targetValue: 10,
      },
    };
    setExercises((prev) => {
      if (atIndex === undefined) {
        return [...prev, newItem];
      }
      return [...prev.slice(0, atIndex), newItem, ...prev.slice(atIndex)];
    });
  }, []);

  // Duplicate item (copy and insert below)
  const duplicateItem = useCallback((id: string) => {
    setExercises((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;

      const itemToDuplicate = prev[index];
      const duplicated: SequenceItemWithId = {
        ...itemToDuplicate,
        id: `${itemToDuplicate.exerciseId}-${Date.now()}`,
      };

      // Insert right after the original
      return [
        ...prev.slice(0, index + 1),
        duplicated,
        ...prev.slice(index + 1),
      ];
    });
  }, []);

  // Remove item
  const removeItem = useCallback((id: string) => {
    setExercises((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Update item config
  const updateItemConfig = useCallback(
    (id: string, config: Partial<SequenceItemWithId["config"]>) => {
      setExercises((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, config: { ...item.config, ...config } }
            : item
        )
      );
    },
    []
  );

  // Save sequence
  const handleSave = async () => {
    if (!sequence) return;

    // Strip IDs before saving
    const exercisesToSave = exercises.map(({ id: _id, ...rest }) => rest);

    await updateSequence.mutateAsync({
      id: sequenceId,
      name,
      description: description || undefined,
      goal,
      exercises: exercisesToSave,
      availableModifiers,
    });

    navigate({ to: "/sequences" });
  };

  // Toggle modifier availability for the sequence
  const toggleModifier = useCallback((modifierId: number) => {
    setAvailableModifiers((prev) =>
      prev.includes(modifierId)
        ? prev.filter((id) => id !== modifierId)
        : [...prev, modifierId]
    );
  }, []);

  // Update item modifiers (per exercise)
  const updateItemModifiers = useCallback(
    (id: string, modifiers: ExerciseModifierAssignment[]) => {
      setExercises((prev) =>
        prev.map((item) => (item.id === id ? { ...item, modifiers } : item))
      );
    },
    []
  );

  // Apply batch config to selected exercises
  const applyBatchConfig = useCallback(() => {
    if (selectedItems.size === 0) return;

    setExercises((prev) =>
      prev.map((item) =>
        selectedItems.has(item.id) && item.exerciseId !== "break"
          ? {
              ...item,
              config: {
                measure: batchMeasure,
                targetValue: batchTargetValue,
              },
              modifiers:
                batchModifiers.length > 0 ? [...batchModifiers] : undefined,
            }
          : item
      )
    );

    // Clear selection and exit modes
    setSelectedItems(new Set());
    setSelectionMode(false);
    setIsBatchConfigOpen(false);
    // Reset batch config
    setBatchMeasure("time");
    setBatchTargetValue(30);
    setBatchModifiers([]);
  }, [selectedItems, batchMeasure, batchTargetValue, batchModifiers]);

  // Toggle item selection
  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Batch clone selected items
  const batchCloneSelected = useCallback(() => {
    if (selectedItems.size === 0) return;

    setExercises((prev) => {
      const newItems: SequenceItemWithId[] = [];
      // Clone each selected item, maintaining order
      prev.forEach((item) => {
        newItems.push(item);
        if (selectedItems.has(item.id)) {
          // Insert clone right after the original
          newItems.push({
            ...item,
            id: `${item.exerciseId}-${Date.now()}-${Math.random()}`,
          });
        }
      });
      return newItems;
    });

    // Clear selection and exit mode
    setSelectedItems(new Set());
    setSelectionMode(false);
  }, [selectedItems]);

  // Batch delete selected items
  const batchDeleteSelected = useCallback(() => {
    if (selectedItems.size === 0) return;

    setExercises((prev) => prev.filter((item) => !selectedItems.has(item.id)));

    // Clear selection and exit mode
    setSelectedItems(new Set());
    setSelectionMode(false);
  }, [selectedItems]);

  // Add exercise with multiply (multi-insert)
  const addExerciseMultiple = useCallback(
    (exerciseId: number, count: number) => {
      const newItems: SequenceItemWithId[] = [];
      for (let i = 0; i < count; i++) {
        newItems.push({
          id: `${exerciseId}-${Date.now()}-${i}`,
          exerciseId,
          config: {
            measure: "time",
            targetValue: 30,
          },
        });
      }
      setExercises((prev) => [...prev, ...newItems]);
      setIsPickerOpen(false);
      setMultiplyCount(1); // Reset counter
    },
    []
  );

  // Sync configureItem when exercises state changes
  useEffect(() => {
    if (configureItem) {
      const updatedItem = exercises.find((ex) => ex.id === configureItem.id);
      if (updatedItem) {
        setConfigureItem(updatedItem);
      }
    }
  }, [exercises, configureItem?.id]);

  // Get modifier by ID
  const getModifierById = useCallback(
    (modifierId: number): Modifier | undefined => {
      return allModifiers?.find((m) => m.id === modifierId);
    },
    [allModifiers]
  );

  // Get exercise name by ID
  const getExerciseName = (exerciseId: number | "break"): string => {
    if (exerciseId === "break") return "Break";
    return (
      allExercises?.find((ex) => ex.id === exerciseId)?.name ||
      `Exercise #${exerciseId}`
    );
  };

  // Calculate total duration
  const totalDuration = exercises.reduce((acc, item) => {
    if (item.config.measure === "time" && item.config.targetValue) {
      return acc + item.config.targetValue;
    }
    return acc;
  }, 0);

  if (sequenceLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!sequence) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Sequence not found</p>
        <Button onClick={() => navigate({ to: "/sequences" })} className="mt-4">
          Back to Sequences
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-4 p-2 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/sequences" })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Edit Sequence</h1>
          <p className="text-sm text-muted-foreground">
            {exercises.length} exercises • {Math.floor(totalDuration / 60)}m{" "}
            {totalDuration % 60}s
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsPreviewOpen(true)}
        >
          <Eye className="h-5 w-5" />
        </Button>
        <Button onClick={handleSave} disabled={updateSequence.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </header>

      {/* Main content */}
      <main className={cn("flex-1 overflow-y-auto p-1", selectionMode && "pb-20")}>
        {/* Sequence info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Sequence Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sequence name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div>
              <Label>Goal Type</Label>
              <ToggleGroup
                type="single"
                value={goal}
                onValueChange={(value: "strict" | "elastic") => {
                  if (value) setGoal(value);
                }}
                className="justify-start"
              >
                <ToggleGroupItem value="strict" className="flex-1">
                  Strict (exact target)
                </ToggleGroupItem>
                <ToggleGroupItem value="elastic" className="flex-1">
                  Elastic (flexible)
                </ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-muted-foreground mt-1.5">
                Strict: Auto-advance when time target is reached. Elastic:
                Manual progression with option to edit value before completing.
              </p>
            </div>

            {/* Available Modifiers */}
            {allModifiers && allModifiers.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => setIsModifiersExpanded(!isModifiersExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <Package2 className="h-4 w-4 text-muted-foreground" />
                    <Label className="cursor-pointer">
                      Available Modifiers
                    </Label>
                    {availableModifiers.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {availableModifiers.length}
                      </Badge>
                    )}
                  </div>
                  {isModifiersExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isModifiersExpanded && (
                  <div className="mt-3 pl-6">
                    <p className="text-xs text-muted-foreground mb-3">
                      Select equipment that can be used during this sequence
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allModifiers.map((modifier) => {
                        const displayText = [
                          modifier.name,
                          modifier.value !== null &&
                          modifier.value !== undefined
                            ? modifier.value
                            : null,
                          modifier.unit && modifier.unit !== "none"
                            ? modifier.unit
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" ");
                        const isSelected = availableModifiers.includes(
                          modifier.id
                        );
                        return (
                          <button
                            key={modifier.id}
                            type="button"
                            onClick={() => toggleModifier(modifier.id)}
                            className={`
                              px-3 py-1.5 rounded-full text-sm font-medium transition-all
                              ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }
                            `}
                          >
                            {displayText}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exercises list */}
        <div className="space-y-3">
          <h2 className="font-semibold">Exercises</h2>
          <div className="flex flex-wrap gap-2">
            {exercises.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                isActive={selectionMode}
                onClick={() => {
                  setSelectionMode((v) => !v);
                  // Clear selections when exiting selection mode
                  if (selectionMode) {
                    setSelectedItems(new Set());
                  }
                }}
              >
                {selectionMode ? (
                  <X className="h-4 w-4 mr-2" />
                ) : (
                  <CheckSquare className="h-4 w-4 mr-2" />
                )}
                {selectionMode ? "Selecting..." : "Select"}
              </Button>
            )}
            {/* Add Break and Add Exercise buttons - hidden in selection mode */}
            {!selectionMode && (
                              <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addBreak()}
                            >
                              <Coffee className="h-4 w-4 mr-2" />
                              Add Break
                            </Button>
            )}
            {!selectionMode && (
              <Sheet open={isPickerOpen} onOpenChange={setIsPickerOpen}>
              <SheetTrigger asChild>
                <Button type="button" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exercise
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Select Exercise</SheetTitle>
                  <SheetDescription>
                    Choose an exercise to add to your sequence
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4 p-4 border rounded-lg">
                  <Label>Insert Count (Multi-Insert)</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={multiplyCount}
                      onChange={(e) =>
                        setMultiplyCount(
                          Math.max(1, parseInt(e.target.value, 10) || 1)
                        )
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {multiplyCount === 1
                        ? "Insert once"
                        : `Insert ${multiplyCount} times`}
                    </span>
                  </div>
                </div>
                <div className="mt-4 overflow-y-auto max-h-[calc(80vh-200px)]">
                  {allExercises && allExercises.length > 0 ? (
                    <div className="grid gap-2">
                      {allExercises.map((exercise) => (
                        <button
                          key={exercise.id}
                          type="button"
                          onClick={() =>
                            multiplyCount > 1
                              ? addExerciseMultiple(
                                  exercise.id,
                                  multiplyCount
                                )
                              : addExercise(exercise.id)
                          }
                          className="flex items-center gap-3 p-3 text-left hover:bg-muted rounded-lg transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{exercise.name}</p>
                            {exercise.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {exercise.description}
                              </p>
                            )}
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No exercises available. Create some exercises first.
                    </p>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            )}
        {exercises.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={exercises.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 flex flex-col gap-2 w-full">
                {exercises.map((item) => (
                  <div key={item.id}>
                    <SortableExerciseItem
                      item={item}
                      exerciseName={getExerciseName(item.exerciseId)}
                      modifiers={allModifiers}
                      onConfigure={() => setConfigureItem(item)}
                      onDuplicate={() => duplicateItem(item.id)}
                      onRemove={() => removeItem(item.id)}
                      selectionMode={selectionMode}
                      isSelected={selectedItems.has(item.id)}
                      onToggleSelection={() => toggleItemSelection(item.id)}
                    />
                    {/* Insert break button between exercises - hidden in selection mode */}
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <EmptyState
          actionLabel="Add Exercise"
          onAction={() => setIsPickerOpen(true)}
          icon={Plus}
          title="No exercises yet"
          description="Add exercises to build your sequence"
          className="w-full"
          />
        )}
          </div>
        </div>



        {/* Batch action buttons (floating) */}
        {selectionMode && (
          <BatchActionsBar
            selectedCount={selectedItems.size}
            onClone={batchCloneSelected}
            onConfigure={() => setIsBatchConfigOpen(true)}
            onDelete={batchDeleteSelected}
          />
        )}
      </main>

      {/* Configure exercise sheet */}
      <Sheet
        open={!!configureItem}
        onOpenChange={(open) => !open && setConfigureItem(null)}
      >
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>
              Configure{" "}
              {configureItem && getExerciseName(configureItem.exerciseId)}
            </SheetTitle>
            <SheetDescription>
              Set the goal, measure, and target value for this exercise
            </SheetDescription>
          </SheetHeader>
          {configureItem && (
            <div className="mt-4 space-y-4">
              <div>
                <Label>Measure</Label>
                <ToggleGroup
                  type="single"
                  value={configureItem.config.measure}
                  onValueChange={(value: MeasureType) => {
                    if (value)
                      updateItemConfig(configureItem.id, { measure: value });
                  }}
                  className="mt-1.5 justify-start"
                >
                  <ToggleGroupItem value="time" className="flex-1">
                    Time
                  </ToggleGroupItem>
                  <ToggleGroupItem value="repetitions" className="flex-1">
                    Reps
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div>
                <Label>
                  Target Value (
                  {configureItem.config.measure === "time" ? "seconds" : "reps"}
                  )
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={configureItem.config.targetValue || ""}
                  onChange={(e) =>
                    updateItemConfig(configureItem.id, {
                      targetValue: parseInt(e.target.value) || undefined,
                    })
                  }
                  className="mt-1.5"
                />
              </div>

              {/* Modifier assignment (always visible for non-break exercises) */}
              {configureItem.exerciseId !== "break" && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package2 className="h-4 w-4 text-muted-foreground" />
                      <Label>Assign Modifiers</Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsModifierPickerOpen(true)}
                      className="h-7 px-2"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="ml-1 text-xs">Find more</span>
                    </Button>
                  </div>
                  {availableModifiers.length > 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-3">
                        Tap each modifier to cycle: Off → Neutral (○) → Easier
                        (↓) → Harder (↑) → Off
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availableModifiers.map((modifierId) => {
                          const modifier = getModifierById(modifierId);
                          if (!modifier) return null;

                          const assignment = configureItem.modifiers?.find(
                            (m) => m.modifierId === modifierId
                          );
                          const isAssigned = !!assignment;
                          const displayText = [
                            modifier.name,
                            modifier.value !== null &&
                            modifier.value !== undefined
                              ? modifier.value
                              : null,
                            modifier.unit && modifier.unit !== "none"
                              ? modifier.unit
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" ");

                          // Cycle effect: off → neutral → easier → harder → off
                          const cycleEffect = () => {
                            const currentModifiers =
                              configureItem.modifiers || [];
                            if (!isAssigned) {
                              // Off → Neutral
                              updateItemModifiers(configureItem.id, [
                                ...currentModifiers,
                                { modifierId, effect: "neutral" },
                              ]);
                            } else if (assignment.effect === "neutral") {
                              // Neutral → Easier
                              updateItemModifiers(
                                configureItem.id,
                                currentModifiers.map((m) =>
                                  m.modifierId === modifierId
                                    ? { ...m, effect: "easier" }
                                    : m
                                )
                              );
                            } else if (assignment.effect === "easier") {
                              // Easier → Harder
                              updateItemModifiers(
                                configureItem.id,
                                currentModifiers.map((m) =>
                                  m.modifierId === modifierId
                                    ? { ...m, effect: "harder" }
                                    : m
                                )
                              );
                            } else {
                              // Harder → Off
                              updateItemModifiers(
                                configureItem.id,
                                currentModifiers.filter(
                                  (m) => m.modifierId !== modifierId
                                )
                              );
                            }
                          };

                          // Get badge styles based on state (ring-based design)
                          const getBadgeStyles = () => {
                            if (!isAssigned) {
                              // Off state - gray ring
                              return "ring-2 ring-gray-300 text-gray-600 bg-gray-50 hover:bg-gray-100";
                            } else if (assignment.effect === "neutral") {
                              // Neutral - blue ring
                              return "ring-2 ring-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100";
                            } else if (assignment.effect === "easier") {
                              // Easier - green ring
                              return "ring-2 ring-green-500 text-green-700 bg-green-50 hover:bg-green-100";
                            } else {
                              // Harder - red ring
                              return "ring-2 ring-red-500 text-red-700 bg-red-50 hover:bg-red-100";
                            }
                          };

                          // Get icon based on state
                          const getIcon = () => {
                            if (!isAssigned) return "";
                            if (assignment.effect === "neutral") return " ○";
                            if (assignment.effect === "easier") return " ↓";
                            return " ↑";
                          };

                          return (
                            <button
                              key={modifierId}
                              type="button"
                              onClick={cycleEffect}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${getBadgeStyles()}`}
                            >
                              {displayText}
                              {getIcon()}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No modifiers available. Click "Find more" to add modifiers
                      to this sequence.
                    </p>
                  )}
                </div>
              )}

              <Button className="w-full" onClick={() => setConfigureItem(null)}>
                Done
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Preview sheet */}
      <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Sequence Preview</SheetTitle>
            <SheetDescription>
              Review your sequence before saving
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-semibold">{name || "Untitled"}</h3>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{exercises.length} exercises</span>
              <span>•</span>
              <span>
                {Math.floor(totalDuration / 60)}m {totalDuration % 60}s
              </span>
              <span>•</span>
              <span className="capitalize">{goal} mode</span>
            </div>

            <div className="space-y-2">
              {exercises.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 bg-muted/50 rounded"
                >
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {getExerciseName(item.exerciseId)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.config.measure === "time"
                        ? `${item.config.targetValue}s`
                        : `${item.config.targetValue} reps`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modifier picker sheet - add modifiers to sequence and exercise */}
      <Sheet open={isModifierPickerOpen} onOpenChange={setIsModifierPickerOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Add Modifier</SheetTitle>
            <SheetDescription>
              Select a modifier to add to both this sequence and exercise
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 overflow-y-auto h-[calc(80vh-8rem)]">
            {allModifiers && allModifiers.length > 0 ? (
              <div className="grid gap-2">
                {allModifiers
                  .filter((m) => !availableModifiers.includes(m.id))
                  .map((modifier) => {
                    const displayText = [
                      modifier.name,
                      modifier.value !== null && modifier.value !== undefined
                        ? modifier.value
                        : null,
                      modifier.unit && modifier.unit !== "none"
                        ? modifier.unit
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <button
                        key={modifier.id}
                        type="button"
                        onClick={() => {
                          // Add to sequence's available modifiers
                          setAvailableModifiers([
                            ...availableModifiers,
                            modifier.id,
                          ]);
                          // Add to current exercise's modifiers with default neutral effect
                          if (configureItem) {
                            const currentModifiers =
                              configureItem.modifiers || [];
                            updateItemModifiers(configureItem.id, [
                              ...currentModifiers,
                              { modifierId: modifier.id, effect: "neutral" },
                            ]);
                          }
                          setIsModifierPickerOpen(false);
                        }}
                        className="flex items-center gap-3 p-3 text-left border rounded-lg hover:bg-muted transition-colors"
                      >
                        <Package2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{displayText}</p>
                          {modifier.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {modifier.description}
                            </p>
                          )}
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    );
                  })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No modifiers available. Create some modifiers first in the
                Modifiers page.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Batch Configure sheet */}
      <Sheet open={isBatchConfigOpen} onOpenChange={setIsBatchConfigOpen}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>
              Batch Configure {selectedItems.size} Exercises
            </SheetTitle>
            <SheetDescription>
              Set measure, target value, and modifiers for all selected
              exercises
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div>
              <Label>Measure</Label>
              <ToggleGroup
                type="single"
                value={batchMeasure}
                onValueChange={(value: MeasureType) => {
                  if (value) setBatchMeasure(value);
                }}
                className="mt-1.5 justify-start"
              >
                <ToggleGroupItem value="time" className="flex-1">
                  Time
                </ToggleGroupItem>
                <ToggleGroupItem value="repetitions" className="flex-1">
                  Reps
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div>
              <Label>
                Target Value ({batchMeasure === "time" ? "seconds" : "reps"})
              </Label>
              <Input
                type="number"
                min={1}
                value={batchTargetValue || ""}
                onChange={(e) =>
                  setBatchTargetValue(parseInt(e.target.value, 10) || undefined)
                }
                className="mt-1.5"
              />
            </div>

            {/* Batch modifiers assignment */}
            {availableModifiers.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package2 className="h-4 w-4 text-muted-foreground" />
                  <Label>Assign Modifiers</Label>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Tap each modifier to cycle: Off → Neutral (○) → Easier (↓) →
                  Harder (↑) → Off
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableModifiers.map((modifierId) => {
                    const modifier = getModifierById(modifierId);
                    if (!modifier) return null;

                    const assignment = batchModifiers.find(
                      (m) => m.modifierId === modifierId
                    );
                    const isAssigned = !!assignment;
                    const displayText = [
                      modifier.name,
                      modifier.value !== null && modifier.value !== undefined
                        ? modifier.value
                        : null,
                      modifier.unit && modifier.unit !== "none"
                        ? modifier.unit
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    // Cycle effect: off → neutral → easier → harder → off
                    const cycleEffect = () => {
                      if (!isAssigned) {
                        // Off → Neutral
                        setBatchModifiers([
                          ...batchModifiers,
                          { modifierId, effect: "neutral" },
                        ]);
                      } else if (assignment.effect === "neutral") {
                        // Neutral → Easier
                        setBatchModifiers(
                          batchModifiers.map((m) =>
                            m.modifierId === modifierId
                              ? { ...m, effect: "easier" }
                              : m
                          )
                        );
                      } else if (assignment.effect === "easier") {
                        // Easier → Harder
                        setBatchModifiers(
                          batchModifiers.map((m) =>
                            m.modifierId === modifierId
                              ? { ...m, effect: "harder" }
                              : m
                          )
                        );
                      } else {
                        // Harder → Off
                        setBatchModifiers(
                          batchModifiers.filter(
                            (m) => m.modifierId !== modifierId
                          )
                        );
                      }
                    };

                    // Get badge styles based on state
                    const getBadgeStyles = () => {
                      if (!isAssigned) {
                        return "ring-2 ring-gray-300 text-gray-600 bg-gray-50 hover:bg-gray-100";
                      } else if (assignment.effect === "neutral") {
                        return "ring-2 ring-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100";
                      } else if (assignment.effect === "easier") {
                        return "ring-2 ring-green-500 text-green-700 bg-green-50 hover:bg-green-100";
                      } else {
                        return "ring-2 ring-red-500 text-red-700 bg-red-50 hover:bg-red-100";
                      }
                    };

                    // Get icon based on state
                    const getIcon = () => {
                      if (!isAssigned) return "";
                      if (assignment.effect === "neutral") return " ○";
                      if (assignment.effect === "easier") return " ↓";
                      return " ↑";
                    };

                    return (
                      <button
                        key={modifierId}
                        type="button"
                        onClick={cycleEffect}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${getBadgeStyles()}`}
                      >
                        {displayText}
                        {getIcon()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={applyBatchConfig}
                disabled={selectedItems.size === 0}
              >
                Apply to {selectedItems.size} Selected
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsBatchConfigOpen(false);
                  setBatchMeasure("time");
                  setBatchTargetValue(30);
                  setBatchModifiers([]);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
