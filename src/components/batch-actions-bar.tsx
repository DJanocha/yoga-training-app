"use client";

import { Copy, Settings, Trash2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

type BatchActionsBarProps = {
  selectedCount: number;
  onClone: () => void;
  onConfigure: () => void;
  onDelete: () => void;
  onMerge?: () => void;
};

export function BatchActionsBar({
  selectedCount,
  onClone,
  onConfigure,
  onDelete,
  onMerge,
}: BatchActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-10 bg-background px-2">
      <div className="bg-card border border-border rounded-full shadow-lg px-2 py-2 flex items-center gap-1">
        {/* Merge - show when 2+ selected */}
        {selectedCount >= 2 && onMerge && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMerge}
            className="rounded-full h-9 px-3"
          >
            <Layers className="h-4 w-4 mr-1.5" />
            Merge
          </Button>
        )}

        {/* Clone */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClone}
          className="rounded-full h-9 px-3"
        >
          <Copy className="h-4 w-4 mr-1.5" />
          Clone
        </Button>

        {/* Configure - primary action */}
        <Button
          size="sm"
          onClick={onConfigure}
          className="rounded-full h-9 px-3"
        >
          <Settings className="h-4 w-4 mr-1.5" />
          Configure {selectedCount}
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="rounded-full h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}
