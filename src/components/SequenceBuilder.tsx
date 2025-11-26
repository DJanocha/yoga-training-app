import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Plus,
  Minus,
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
  ChevronRight,
  MoreHorizontal,
  Copy,
  Check,
  CheckSquare,
  X,
  Ungroup,
  FileText,
  ListOrdered,
} from "lucide-react";
import type {
  SequenceExercise,
  MeasureType,
  ExerciseModifierAssignment,
  ExerciseGroup,
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

// Sortable group item component
function SortableGroupItem({
  group,
  groupExercises,
  allExercises,
  modifiers,
  isCollapsed,
  onToggleCollapse,
  onUngroup,
  onClone,
  onRename,
  onConfigureExercise,
  onRemoveExercise,
}: {
  group: ExerciseGroup;
  groupExercises: SequenceItemWithId[];
  allExercises?: { id: number; name: string }[];
  modifiers?: Modifier[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onUngroup: () => void;
  onClone: () => void;
  onRename: (newName: string) => void;
  onConfigureExercise: (exercise: SequenceItemWithId) => void;
  onRemoveExercise: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `group:${group.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getExerciseName = (exerciseId: number | "break"): string => {
    if (exerciseId === "break") return "Break";
    return (
      allExercises?.find((ex) => ex.id === exerciseId)?.name ||
      `Exercise #${exerciseId}`
    );
  };

  const handleNameSubmit = () => {
    if (editName.trim()) {
      onRename(editName.trim());
    } else {
      setEditName(group.name);
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-2 border-primary/30 rounded-lg bg-primary/5",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 hover:bg-muted rounded"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNameSubmit();
              if (e.key === "Escape") {
                setEditName(group.name);
                setIsEditing(false);
              }
            }}
            className="h-7 text-sm flex-1"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex-1 text-left font-medium text-sm hover:underline"
          >
            {group.name}
          </button>
        )}

        <Badge variant="secondary" className="text-xs">
          {groupExercises.length}
        </Badge>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClone}
            className="h-7 w-7"
            title="Clone group"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onUngroup}
            className="h-7 w-7"
            title="Ungroup"
          >
            <Ungroup className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Collapsible exercise list */}
      {!isCollapsed && (
        <div className="px-3 pb-3 space-y-1">
          {groupExercises.map((ex) => {
            const isBreak = ex.exerciseId === "break";
            return (
              <div
                key={ex.id}
                className="flex items-center gap-2 p-2 bg-background rounded border"
              >
                {isBreak ? (
                  <Coffee className="h-3.5 w-3.5 text-muted-foreground" />
                ) : null}
                <span className="flex-1 truncate text-sm">
                  {getExerciseName(ex.exerciseId)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {ex.config.targetValue || 0}
                  {ex.config.measure === "time" ? "s" : "x"}
                </span>
                {/* Show assigned modifiers */}
                {modifiers &&
                  ex.modifiers &&
                  ex.modifiers.length > 0 &&
                  ex.modifiers.slice(0, 2).map((assignment) => {
                    const modifier = modifiers.find(
                      (m) => m.id === assignment.modifierId
                    );
                    if (!modifier) return null;
                    return (
                      <Badge
                        key={assignment.modifierId}
                        className="text-[10px] px-1 py-0 bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {modifier.name}
                      </Badge>
                    );
                  })}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onConfigureExercise(ex)}
                  className="h-6 w-6"
                >
                  <Settings className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveExercise(ex.id)}
                  className="h-6 w-6 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
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
  const [groups, setGroups] = useState<ExerciseGroup[]>([]);
  const [availableModifiers, setAvailableModifiers] = useState<number[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<"details" | "exercises">("exercises");
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

  // Collapsed groups state
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Exercise picker configuration
  const [pickerTargetValue, setPickerTargetValue] = useState(30);
  const [pickerMeasure, setPickerMeasure] = useState<MeasureType>("time");

  // Hold-to-repeat refs
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Compute which exercises are grouped
  const groupedExerciseIds = useMemo(() => {
    return new Set(groups.flatMap((g) => g.exerciseIds));
  }, [groups]);

  // Build render list - groups appear at position of first exercise
  type RenderItem =
    | { type: "exercise"; exercise: SequenceItemWithId }
    | { type: "group"; group: ExerciseGroup; exercises: SequenceItemWithId[] };

  const renderItems = useMemo((): RenderItem[] => {
    const items: RenderItem[] = [];
    const processedGroups = new Set<string>();

    for (const exercise of exercises) {
      // Check if this exercise is the first in any unprocessed group
      const group = groups.find(
        (g) => g.exerciseIds[0] === exercise.id && !processedGroups.has(g.id)
      );

      if (group) {
        processedGroups.add(group.id);
        const groupExercises = group.exerciseIds
          .map((id) => exercises.find((e) => e.id === id))
          .filter((e): e is SequenceItemWithId => e !== undefined);
        items.push({ type: "group", group, exercises: groupExercises });
      } else if (!groupedExerciseIds.has(exercise.id)) {
        items.push({ type: "exercise", exercise });
      }
    }
    return items;
  }, [exercises, groups, groupedExerciseIds]);

  // Initialize form when sequence loads
  if (sequence && !isInitialized) {
    setName(sequence.name);
    setDescription(sequence.description || "");
    setGoal((sequence.goal as "strict" | "elastic") || "elastic");
    // Add unique IDs to exercises for DnD (use existing ID if present for backwards compat)
    const exercisesWithIds = (sequence.exercises as SequenceExercise[]).map(
      (ex, index) => ({
        ...ex,
        id: ex.id || `${ex.exerciseId}-${index}-${Date.now()}`,
      })
    );
    setExercises(exercisesWithIds);
    // Load groups for this sequence
    setGroups((sequence.groups as ExerciseGroup[]) || []);
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

  // Handle drag end (supports both individual exercises and groups)
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      // Check if dragging a group
      if (activeId.startsWith("group:")) {
        const groupId = activeId.slice(6);
        const group = groups.find((g) => g.id === groupId);
        if (!group) return;

        // Find target position in flat exercises array
        let targetIndex: number;
        if (overId.startsWith("group:")) {
          const targetGroupId = overId.slice(6);
          const targetGroup = groups.find((g) => g.id === targetGroupId);
          if (!targetGroup) return;
          targetIndex = exercises.findIndex(
            (e) => e.id === targetGroup.exerciseIds[0]
          );
        } else {
          targetIndex = exercises.findIndex((e) => e.id === overId);
        }

        // Move group exercises together
        const groupExercises = group.exerciseIds
          .map((id) => exercises.find((e) => e.id === id))
          .filter((e): e is SequenceItemWithId => e !== undefined);
        const withoutGroup = exercises.filter(
          (e) => !group.exerciseIds.includes(e.id)
        );

        // Calculate adjusted target index (accounts for removed items)
        const originalFirstIndex = exercises.findIndex(
          (e) => e.id === group.exerciseIds[0]
        );
        const adjustedIndex =
          targetIndex > originalFirstIndex
            ? targetIndex - group.exerciseIds.length + 1
            : targetIndex;

        setExercises([
          ...withoutGroup.slice(0, adjustedIndex),
          ...groupExercises,
          ...withoutGroup.slice(adjustedIndex),
        ]);
      } else {
        // Regular exercise move
        setExercises((items) => {
          const oldIndex = items.findIndex((item) => item.id === activeId);
          const newIndex = items.findIndex((item) => item.id === overId);
          if (oldIndex === -1 || newIndex === -1) return items;
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    },
    [groups, exercises]
  );

  // Add exercise
  const addExercise = useCallback((exerciseId: number) => {
    const newItem: SequenceItemWithId = {
      id: `${exerciseId}-${Date.now()}`,
      exerciseId,
      config: {
        measure: pickerMeasure,
        targetValue: pickerTargetValue,
      },
    };
    setExercises((prev) => [...prev, newItem]);
    setIsPickerOpen(false);
  }, [pickerMeasure, pickerTargetValue]);

  // Hold-to-repeat increment/decrement
  const startHoldRepeat = useCallback((callback: () => void, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();

    // Clear any existing intervals
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);

    // Initial click
    callback();

    // Start repeating after 500ms hold
    holdTimeoutRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        callback();
      }, 100); // Repeat every 100ms
    }, 500);
  }, []);

  const stopHoldRepeat = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  }, []);

  // Increment/decrement helpers
  const incrementValue = useCallback(() => {
    setPickerTargetValue(prev => prev + 1);
  }, []);

  const decrementValue = useCallback(() => {
    setPickerTargetValue(prev => Math.max(1, prev - 1));
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

  // Remove item (also cascade to groups)
  const removeItem = useCallback((id: string) => {
    setExercises((prev) => prev.filter((item) => item.id !== id));
    // Remove from groups and delete empty groups
    setGroups((prev) =>
      prev
        .map((g) => ({
          ...g,
          exerciseIds: g.exerciseIds.filter((exId) => exId !== id),
        }))
        .filter((g) => g.exerciseIds.length > 0)
    );
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

    // Keep IDs when saving (needed for group references)
    const exercisesToSave = exercises.map((ex) => ({
      id: ex.id,
      exerciseId: ex.exerciseId,
      config: ex.config,
      modifiers: ex.modifiers,
    }));

    await updateSequence.mutateAsync({
      id: sequenceId,
      name,
      description: description || undefined,
      goal,
      exercises: exercisesToSave,
      groups,
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

  // Toggle item selection (only ungrouped exercises can be selected)
  const toggleItemSelection = useCallback(
    (id: string) => {
      if (groupedExerciseIds.has(id)) return; // Can't select grouped exercises
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    },
    [groupedExerciseIds]
  );

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

  // Merge selected exercises into a group
  const mergeSelectedIntoGroup = useCallback(() => {
    if (selectedItems.size < 2) return;

    // Get selected IDs in order they appear in exercises array
    const selectedIds = exercises
      .filter((e) => selectedItems.has(e.id))
      .map((e) => e.id);

    const newGroup: ExerciseGroup = {
      id: `group-${Date.now()}`,
      name: "New Group",
      exerciseIds: selectedIds,
    };

    setGroups((prev) => [...prev, newGroup]);
    setSelectedItems(new Set());
    setSelectionMode(false);
  }, [selectedItems, exercises]);

  // Ungroup exercises (dissolve group)
  const ungroupExercises = useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  // Clone a group (duplicate exercises and create new group)
  const cloneGroup = useCallback(
    (groupId: string) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      // Clone exercises with new IDs
      const newExercises: SequenceItemWithId[] = [];
      const newExerciseIds: string[] = [];

      group.exerciseIds.forEach((oldId, i) => {
        const original = exercises.find((e) => e.id === oldId);
        if (original) {
          const newId = `${original.exerciseId}-${Date.now()}-${i}`;
          newExercises.push({ ...original, id: newId });
          newExerciseIds.push(newId);
        }
      });

      // Insert after original group (after last exercise of the group)
      const lastOriginalIndex = Math.max(
        ...group.exerciseIds.map((id) => exercises.findIndex((e) => e.id === id))
      );

      setExercises((prev) => [
        ...prev.slice(0, lastOriginalIndex + 1),
        ...newExercises,
        ...prev.slice(lastOriginalIndex + 1),
      ]);

      // Create new group with same name
      setGroups((prev) => [
        ...prev,
        {
          id: `group-${Date.now()}-clone`,
          name: group.name,
          exerciseIds: newExerciseIds,
        },
      ]);
    },
    [groups, exercises]
  );

  // Rename a group
  const renameGroup = useCallback((groupId: string, newName: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name: newName } : g))
    );
  }, []);

  // Toggle group collapsed state
  const toggleGroupCollapsed = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

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

      {/* Main content with tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "details" | "exercises")} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-2 mx-1 mt-1">
          <TabsTrigger value="exercises" className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4" />
            Exercises
            {exercises.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-1">
                {exercises.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Details
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="flex-1 overflow-y-auto p-2 mt-0">
          <Card>
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
        </TabsContent>

        {/* Exercises Tab */}
        <TabsContent value="exercises" className={cn("flex-1 p-1 mt-0 flex flex-col min-h-0", selectionMode && "pb-20")}>
          <div className="flex flex-wrap gap-2 shrink-0">
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

                {/* Configuration Controls */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onMouseDown={(e) => startHoldRepeat(decrementValue, e)}
                    onMouseUp={stopHoldRepeat}
                    onMouseLeave={stopHoldRepeat}
                    onTouchStart={(e) => startHoldRepeat(decrementValue, e)}
                    onTouchEnd={stopHoldRepeat}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={pickerTargetValue}
                    onChange={(e) => setPickerTargetValue(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onMouseDown={(e) => startHoldRepeat(incrementValue, e)}
                    onMouseUp={stopHoldRepeat}
                    onMouseLeave={stopHoldRepeat}
                    onTouchStart={(e) => startHoldRepeat(incrementValue, e)}
                    onTouchEnd={stopHoldRepeat}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <ToggleGroup
                    type="single"
                    value={pickerMeasure}
                    onValueChange={(value) => {
                      if (value) setPickerMeasure(value as MeasureType)
                    }}
                    variant="outline"
                    spacing={0}
                  >
                    <ToggleGroupItem value="repetitions" aria-label="Repetitions">
                      reps
                    </ToggleGroupItem>
                    <ToggleGroupItem value="time" aria-label="Time">
                      sec
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="mt-4 overflow-y-auto max-h-[calc(80vh-260px)]">
                  {allExercises && allExercises.length > 0 ? (
                    <div className="grid gap-2">
                      {allExercises.map((exercise) => (
                        <button
                          key={exercise.id}
                          type="button"
                          onClick={() => addExercise(exercise.id)}
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
          </div>

          {/* Scrollable exercise list */}
          <div className="flex-1 overflow-y-auto mt-3 min-h-0">
        {exercises.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={renderItems.map((item) =>
                item.type === "group" ? `group:${item.group.id}` : item.exercise.id
              )}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 flex flex-col gap-2 w-full">
                {renderItems.map((renderItem) => {
                  if (renderItem.type === "group") {
                    return (
                      <SortableGroupItem
                        key={`group:${renderItem.group.id}`}
                        group={renderItem.group}
                        groupExercises={renderItem.exercises}
                        allExercises={allExercises}
                        modifiers={allModifiers}
                        isCollapsed={collapsedGroups.has(renderItem.group.id)}
                        onToggleCollapse={() => toggleGroupCollapsed(renderItem.group.id)}
                        onUngroup={() => ungroupExercises(renderItem.group.id)}
                        onClone={() => cloneGroup(renderItem.group.id)}
                        onRename={(newName) => renameGroup(renderItem.group.id, newName)}
                        onConfigureExercise={(ex) => setConfigureItem(ex)}
                        onRemoveExercise={removeItem}
                      />
                    );
                  }
                  return (
                    <SortableExerciseItem
                      key={renderItem.exercise.id}
                      item={renderItem.exercise}
                      exerciseName={getExerciseName(renderItem.exercise.exerciseId)}
                      modifiers={allModifiers}
                      onConfigure={() => setConfigureItem(renderItem.exercise)}
                      onDuplicate={() => duplicateItem(renderItem.exercise.id)}
                      onRemove={() => removeItem(renderItem.exercise.id)}
                      selectionMode={selectionMode}
                      isSelected={selectedItems.has(renderItem.exercise.id)}
                      onToggleSelection={() => toggleItemSelection(renderItem.exercise.id)}
                    />
                  );
                })}
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

        {/* Batch action buttons (floating) */}
        {selectionMode && (
          <BatchActionsBar
            selectedCount={selectedItems.size}
            onClone={batchCloneSelected}
            onConfigure={() => setIsBatchConfigOpen(true)}
            onDelete={batchDeleteSelected}
            onMerge={mergeSelectedIntoGroup}
          />
        )}
        </TabsContent>
      </Tabs>

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
