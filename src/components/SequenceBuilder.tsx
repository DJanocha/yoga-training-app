import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTRPC } from "@/lib/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ExercisePickerConfig } from "@/components/exercise-picker-drawer";
import { WheelNumberInput } from "@/components/ui/wheel-number-input";
import { WheelSelect } from "@/components/ui/wheel-select";
import { ConfigWheels } from "@/components/ui/config-wheels";
import { Backpack } from "@/components/ui/backpack";
import { SequenceTypeSelector } from "@/components/ui/sequence-type-selector";
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
} from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  ChevronRight,
  MoreHorizontal,
  Copy,
  Check,
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
import { UnifiedModeDock, type DockMode } from "@/components/ui/unified-mode-dock";
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
  onDelete,
  onRename,
  onConfigureExercise,
  onRemoveExercise,
  selectionMode,
  isSelected,
  onToggleSelection,
}: {
  group: ExerciseGroup;
  groupExercises: SequenceItemWithId[];
  allExercises?: { id: number; name: string }[];
  modifiers?: Modifier[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onUngroup: () => void;
  onClone: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
  onConfigureExercise: (exercise: SequenceItemWithId) => void;
  onRemoveExercise: (id: string) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
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

  // In selection mode, clicking the group toggles selection
  const handleGroupClick = () => {
    if (selectionMode && onToggleSelection) {
      onToggleSelection();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-2 rounded-lg",
        isSelected
          ? "border-primary bg-primary/10"
          : "border-primary/30 bg-primary/5",
        isDragging && "opacity-50 shadow-lg",
        selectionMode && "cursor-pointer hover:bg-primary/15"
      )}
      onClick={handleGroupClick}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3">
        {/* Selection checkbox (in selection mode) */}
        {selectionMode && (
          <div
            className={cn(
              "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0",
              isSelected
                ? "bg-primary border-primary"
                : "border-muted-foreground/50"
            )}
          >
            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
          </div>
        )}

        {/* Drag handle (not in selection mode) */}
        {!selectionMode && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="p-1 hover:bg-muted rounded"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Group name - editable only when not in selection mode */}
        {isEditing && !selectionMode ? (
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
            className="h-8 text-base flex-1"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={cn(
              "flex-1 text-left font-medium text-base truncate",
              !selectionMode && "cursor-pointer hover:underline"
            )}
            onClick={(e) => {
              if (!selectionMode) {
                e.stopPropagation();
                setIsEditing(true);
              }
            }}
          >
            {group.name}
          </span>
        )}

        <Badge variant="secondary" className="text-xs">
          {groupExercises.length}
        </Badge>

        {/* Group actions - hidden in selection mode */}
        {!selectionMode && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                  title="Delete group"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete group "{group.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete the group and all {groupExercises.length} exercises inside it.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
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
                {/* Hide exercise actions in selection mode */}
                {!selectionMode && (
                  <>
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
                  </>
                )}
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
  const [defaultMeasure, setDefaultMeasure] = useState<MeasureType>("time");
  const [defaultTargetValue, setDefaultTargetValue] = useState<number>(30);
  const [isInitialized, setIsInitialized] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<"details" | "exercises">("exercises");
  const [configureItem, setConfigureItem] = useState<SequenceItemWithId | null>(
    null
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isModifierPickerOpen, setIsModifierPickerOpen] = useState(false);

  // Dock mode for unified mode dock
  const [dockMode, setDockMode] = useState<DockMode>(null);
  const selectionMode = dockMode === "select";
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

  // Exercise picker drawer state
  // Removed: exercisePickerOpen state - now using inline picker in UnifiedModeDock

  // Compute which exercises are grouped
  const groupedExerciseIds = useMemo(() => {
    return new Set(groups.flatMap((g) => g.exerciseIds));
  }, [groups]);

  // Compute effective selection - flattens groups to their exercise IDs
  // Supports mixed selection of groups and standalone exercises
  const getEffectiveSelection = useCallback((): Set<string> => {
    const effectiveIds = new Set<string>();

    for (const selectedId of selectedItems) {
      if (selectedId.startsWith("group:")) {
        // It's a group - add all exercises in the group
        const groupId = selectedId.replace("group:", "");
        const group = groups.find((g) => g.id === groupId);
        if (group) {
          group.exerciseIds.forEach((id) => effectiveIds.add(id));
        }
      } else {
        // It's a standalone exercise
        effectiveIds.add(selectedId);
      }
    }

    return effectiveIds;
  }, [selectedItems, groups]);

  // Count of effectively selected exercises (for display)
  const effectiveSelectionCount = useMemo(() => {
    return getEffectiveSelection().size;
  }, [getEffectiveSelection]);

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
    // Load default exercise config
    const defaultConfig = (sequence.defaultExerciseConfig as { measure: MeasureType; targetValue: number } | null);
    if (defaultConfig) {
      setDefaultMeasure(defaultConfig.measure);
      setDefaultTargetValue(defaultConfig.targetValue);
    }
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
  const handleExerciseSelected = useCallback((exerciseId: number, config: ExercisePickerConfig) => {
    const newItem: SequenceItemWithId = {
      id: `${exerciseId}-${Date.now()}`,
      exerciseId,
      config: {
        measure: config.measure,
        targetValue: config.targetValue,
      },
    };
    setExercises((prev) => [...prev, newItem]);
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
      defaultExerciseConfig: {
        measure: defaultMeasure,
        targetValue: defaultTargetValue,
      },
    });

    navigate({ to: "/sequences" });
  };

  // Update item modifiers (per exercise)
  const updateItemModifiers = useCallback(
    (id: string, modifiers: ExerciseModifierAssignment[]) => {
      setExercises((prev) =>
        prev.map((item) => (item.id === id ? { ...item, modifiers } : item))
      );
    },
    []
  );

  // Apply batch config to selected exercises (uses effective selection for groups)
  const applyBatchConfig = useCallback(() => {
    if (selectedItems.size === 0) return;

    const effectiveIds = getEffectiveSelection();

    setExercises((prev) =>
      prev.map((item) =>
        effectiveIds.has(item.id) && item.exerciseId !== "break"
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
    setDockMode(null);
    setIsBatchConfigOpen(false);
    // Reset batch config
    setBatchMeasure("time");
    setBatchTargetValue(30);
    setBatchModifiers([]);
  }, [selectedItems, batchMeasure, batchTargetValue, batchModifiers, getEffectiveSelection]);

  // Toggle item selection (groups or ungrouped exercises)
  const toggleItemSelection = useCallback(
    (id: string) => {
      // Grouped exercises cannot be selected individually - select the group instead
      if (!id.startsWith("group:") && groupedExerciseIds.has(id)) return;

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

  // Toggle group selection
  const toggleGroupSelection = useCallback((groupId: string) => {
    const selectionId = `group:${groupId}`;
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(selectionId)) {
        newSet.delete(selectionId);
      } else {
        newSet.add(selectionId);
      }
      return newSet;
    });
  }, []);

  // Batch clone selected items (handles both groups and exercises)
  // Clones are inserted right after their originals
  // Groups are cloned with new IDs, containing cloned exercises
  const batchCloneSelected = useCallback(() => {
    if (selectedItems.size === 0) return;

    const selectedGroupIds = new Set<string>();

    // Identify selected groups
    for (const id of selectedItems) {
      if (id.startsWith("group:")) {
        selectedGroupIds.add(id.replace("group:", ""));
      }
    }

    // Identify standalone selected exercises (not part of a selected group)
    const standaloneSelectedIds = new Set<string>();
    for (const id of selectedItems) {
      if (!id.startsWith("group:")) {
        standaloneSelectedIds.add(id);
      }
    }

    // Pre-generate ID mappings for all exercises that will be cloned
    // This allows us to update both exercises and groups atomically
    const idMapping = new Map<string, string>();
    const timestamp = Date.now();
    let counter = 0;

    // Generate IDs for standalone exercises
    for (const id of standaloneSelectedIds) {
      // Check if this exercise is in a selected group - if so, skip (will be handled with group)
      let isInSelectedGroup = false;
      for (const groupId of selectedGroupIds) {
        const group = groups.find((g) => g.id === groupId);
        if (group?.exerciseIds.includes(id)) {
          isInSelectedGroup = true;
          break;
        }
      }
      if (!isInSelectedGroup) {
        const exercise = exercises.find((e) => e.id === id);
        if (exercise) {
          idMapping.set(id, `${exercise.exerciseId}-${timestamp}-${counter++}`);
        }
      }
    }

    // Generate IDs for exercises in selected groups
    for (const groupId of selectedGroupIds) {
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        for (const exerciseId of group.exerciseIds) {
          const exercise = exercises.find((e) => e.id === exerciseId);
          if (exercise) {
            idMapping.set(exerciseId, `${exercise.exerciseId}-${timestamp}-${counter++}`);
          }
        }
      }
    }

    // Collect exercises that belong to selected groups
    const groupExerciseIds = new Set<string>();
    for (const groupId of selectedGroupIds) {
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        group.exerciseIds.forEach((id) => groupExerciseIds.add(id));
      }
    }

    // Clone exercises
    setExercises((prev) => {
      const newItems: SequenceItemWithId[] = [];

      // Process exercises - clone standalone ones right after their originals
      for (const item of prev) {
        newItems.push(item);

        // Clone standalone selected exercises (insert right after original)
        if (standaloneSelectedIds.has(item.id) && !groupExerciseIds.has(item.id)) {
          const clonedId = idMapping.get(item.id);
          if (clonedId) {
            newItems.push({
              ...item,
              id: clonedId,
            });
          }
        }
      }

      // For each selected group, insert cloned exercises right after the group's last exercise
      for (const groupId of selectedGroupIds) {
        const group = groups.find((g) => g.id === groupId);
        if (!group) continue;

        // Find the index of the last exercise of this group in newItems
        let lastGroupExerciseIndex = -1;
        for (let i = 0; i < newItems.length; i++) {
          if (group.exerciseIds.includes(newItems[i].id)) {
            lastGroupExerciseIndex = i;
          }
        }

        if (lastGroupExerciseIndex === -1) continue;

        // Clone all exercises in this group (maintaining order)
        const clonedGroupExercises: SequenceItemWithId[] = [];
        for (const exerciseId of group.exerciseIds) {
          const originalExercise = prev.find((e) => e.id === exerciseId);
          const clonedId = idMapping.get(exerciseId);
          if (originalExercise && clonedId) {
            clonedGroupExercises.push({
              ...originalExercise,
              id: clonedId,
            });
          }
        }

        // Insert cloned exercises right after the last exercise of the original group
        newItems.splice(lastGroupExerciseIndex + 1, 0, ...clonedGroupExercises);
      }

      return newItems;
    });

    // Clone groups with new IDs pointing to cloned exercises
    if (selectedGroupIds.size > 0) {
      setGroups((prev) => {
        const newGroups: ExerciseGroup[] = [];

        for (const group of prev) {
          newGroups.push(group);

          // If this group was selected, create a cloned group right after it
          if (selectedGroupIds.has(group.id)) {
            const clonedExerciseIds = group.exerciseIds
              .map((id) => idMapping.get(id))
              .filter((id): id is string => id !== undefined);

            if (clonedExerciseIds.length > 0) {
              newGroups.push({
                id: `group-${timestamp}-${counter++}`,
                name: group.name, // Keep same name for cloned group
                exerciseIds: clonedExerciseIds,
              });
            }
          }
        }

        return newGroups;
      });
    }

    // Clear selection and exit mode
    setSelectedItems(new Set());
    setDockMode(null);
  }, [selectedItems, groups, exercises]);

  // Batch delete selected items (handles both groups and exercises)
  const batchDeleteSelected = useCallback(() => {
    if (selectedItems.size === 0) return;

    const effectiveIds = getEffectiveSelection();
    const selectedGroupIds = new Set<string>();

    // Identify selected groups
    for (const id of selectedItems) {
      if (id.startsWith("group:")) {
        selectedGroupIds.add(id.replace("group:", ""));
      }
    }

    // Delete exercises
    setExercises((prev) => prev.filter((item) => !effectiveIds.has(item.id)));

    // Delete selected groups
    if (selectedGroupIds.size > 0) {
      setGroups((prev) => prev.filter((g) => !selectedGroupIds.has(g.id)));
    }

    // Clear selection and exit mode
    setSelectedItems(new Set());
    setDockMode(null);
  }, [selectedItems, getEffectiveSelection]);

  // Merge selected exercises into a group (supports mixed selection)
  const mergeSelectedIntoGroup = useCallback(() => {
    const effectiveIds = getEffectiveSelection();
    if (effectiveIds.size < 2) return;

    // Get selected IDs in order they appear in exercises array
    const selectedIds = exercises
      .filter((e) => effectiveIds.has(e.id))
      .map((e) => e.id);

    // Identify selected groups
    const selectedGroupIds = new Set<string>();
    for (const id of selectedItems) {
      if (id.startsWith("group:")) {
        selectedGroupIds.add(id.replace("group:", ""));
      }
    }

    // Get name from first selected group in sequence order (based on renderItems order)
    let groupName = "New Group";
    for (const item of renderItems) {
      if (item.type === "group" && selectedGroupIds.has(item.group.id)) {
        groupName = item.group.name;
        break;
      }
    }

    const newGroup: ExerciseGroup = {
      id: `group-${Date.now()}`,
      name: groupName,
      exerciseIds: selectedIds,
    };

    setGroups((prev) => [
      ...prev.filter((g) => !selectedGroupIds.has(g.id)),
      newGroup,
    ]);
    setSelectedItems(new Set());
    setDockMode(null);
  }, [selectedItems, exercises, renderItems, getEffectiveSelection]);

  // Ungroup exercises (dissolve group)
  const ungroupExercises = useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  // Delete group and all its exercises
  const deleteGroup = useCallback((groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    // Remove all exercises in the group
    setExercises((prev) => prev.filter((ex) => !group.exerciseIds.includes(ex.id)));
    // Remove the group
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, [groups]);

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
                <Label>Sequence Type</Label>
                <SequenceTypeSelector
                  value={goal}
                  onChange={setGoal}
                  size="md"
                  className="mt-2"
                />
              </div>

              {/* Default Exercise Config */}
              <div>
                <Label>Default Exercise Config</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  New exercises will use these defaults
                </p>
                <div className="flex justify-center">
                  <ConfigWheels
                    value={defaultTargetValue}
                    onValueChange={setDefaultTargetValue}
                    measure={defaultMeasure}
                    onMeasureChange={setDefaultMeasure}
                    label=""
                  />
                </div>
              </div>

              {/* Available Mods */}
              {allModifiers && allModifiers.length > 0 && (
                <div>
                  <Label>Available Mods</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Select equipment for this sequence
                  </p>
                  <div className="flex justify-center">
                    <Backpack.Root
                      items={allModifiers.map((m) => ({
                        id: m.id,
                        name: m.name,
                        value: m.value,
                        unit: m.unit,
                      }))}
                      value={availableModifiers.map((id) => ({
                        id,
                        effect: "neutral" as const,
                      }))}
                      onChange={(items) => {
                        setAvailableModifiers(items.map((i) => i.id as number));
                      }}
                      cols={3}
                      rows={Math.ceil(allModifiers.length / 3)}
                      editable={true}
                    >
                      <Backpack.Container theme="brown">
                        <Backpack.Grid>
                          {allModifiers.map((modifier) => (
                            <Backpack.Slot
                              key={modifier.id}
                              item={{
                                id: modifier.id,
                                name: modifier.name,
                                value: modifier.value,
                                unit: modifier.unit,
                              }}
                            >
                              <Backpack.ItemContent
                                item={{
                                  id: modifier.id,
                                  name: modifier.name,
                                  value: modifier.value,
                                  unit: modifier.unit,
                                }}
                                showBadge={false}
                              />
                            </Backpack.Slot>
                          ))}
                        </Backpack.Grid>
                      </Backpack.Container>
                      <Backpack.Label>Tap to select</Backpack.Label>
                    </Backpack.Root>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exercises Tab */}
        <TabsContent value="exercises" className={cn("flex-1 p-1 mt-0 flex flex-col min-h-0", "pb-24")}>
          {/* Exercise picker now inline in UnifiedModeDock */}

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
                        onDelete={() => deleteGroup(renderItem.group.id)}
                        onRename={(newName) => renameGroup(renderItem.group.id, newName)}
                        onConfigureExercise={(ex) => setConfigureItem(ex)}
                        onRemoveExercise={removeItem}
                        selectionMode={selectionMode}
                        isSelected={selectedItems.has(`group:${renderItem.group.id}`)}
                        onToggleSelection={() => toggleGroupSelection(renderItem.group.id)}
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
          onAction={() => setDockMode("add")}
          icon={Plus}
          title="No exercises yet"
          description="Add exercises to build your sequence"
          className="w-full"
          />
        )}
          </div>

        {/* Unified Mode Dock */}
        <UnifiedModeDock
          activeMode={dockMode}
          onModeChange={(mode) => {
            setDockMode(mode);
            if (mode !== "select") {
              setSelectedItems(new Set());
            }
          }}
          selectedCount={effectiveSelectionCount}
          onMerge={mergeSelectedIntoGroup}
          onClone={batchCloneSelected}
          onConfigure={() => setIsBatchConfigOpen(true)}
          onDelete={batchDeleteSelected}
          canMerge={effectiveSelectionCount >= 2}
          exercises={allExercises?.map((ex) => ({
            id: ex.id,
            name: ex.name,
            description: ex.description,
          })) ?? []}
          onExerciseAdd={(exerciseId, config) => {
            handleExerciseSelected(exerciseId, config);
          }}
          onBreakAdd={() => {
            addBreak();
          }}
          showBreakOption
          defaultConfig={{
            targetValue: defaultTargetValue,
            measure: defaultMeasure,
          }}
          helpContent={{
            title: "Sequence Builder",
            description: "Build your workout sequence by adding and organizing exercises.",
            tips: [
              "Tap Select to enable multi-select mode",
              "Drag exercises to reorder them",
              "Groups let you organize related exercises",
              "Configure multiple exercises at once with batch edit",
            ],
          }}
        />
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
              {/* Configuration Controls - Two Wheels Side by Side */}
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <WheelNumberInput
                    value={configureItem.config.targetValue || 30}
                    onChange={(value) =>
                      updateItemConfig(configureItem.id, {
                        targetValue: value,
                      })
                    }
                    min={1}
                    max={999}
                  />
                  <span className="text-xs text-muted-foreground">Value</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <WheelSelect
                    value={configureItem.config.measure}
                    onChange={(value) =>
                      updateItemConfig(configureItem.id, { measure: value })
                    }
                    options={['repetitions', 'time'] as const}
                    formatOption={(opt) => opt === 'repetitions' ? 'reps' : 'sec'}
                  />
                  <span className="text-xs text-muted-foreground">Unit</span>
                </div>
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
              Batch Configure {effectiveSelectionCount} Exercises
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
                disabled={effectiveSelectionCount === 0}
              >
                Apply to {effectiveSelectionCount} Selected
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
